import { useRef, useState } from 'react'
import {
  formatBolivares,
  parseBolivares
} from '../utils/formatters'
import { findTotal } from '../utils/ocrUtils'

const OCR_STATE = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILURE: 'failure'
}

const OCR_ERROR_MESSAGES = {
  CAMERA: 'No se pudo acceder a la cámara. Puedes escribir el monto manualmente.',
  NO_TEXT: 'No se pudo leer la factura. Intenta más cerca del total.',
  NO_TOTAL: 'No encontré el total. Puedes escribir el monto manualmente.',
  TESSERACT: 'Error al cargar el escáner. Verifica tu conexión a internet.',
  DEFAULT: 'No encontré el total. Puedes escribir el monto manualmente.'
}

export default function CameraCapture({
  onAmountDetected,
  onManualEntry,
  disabled = false,
  preloadStatus = 'idle'
}) {
  const fileInputRef = useRef(null)
  const [state, setState] = useState(OCR_STATE.IDLE)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [editableAmount, setEditableAmount] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  function resetToIdle() {
    setState(OCR_STATE.IDLE)
    setProgress(0)
    setProgressMessage('')
    setEditableAmount('')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleScanClick() {
    if (disabled) return
    fileInputRef.current?.click()
  }

  async function handleImageSelected(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setErrorMessage(OCR_ERROR_MESSAGES.CAMERA)
      setState(OCR_STATE.FAILURE)
      return
    }

    setState(OCR_STATE.PROCESSING)
    setProgress(5)
    setProgressMessage('Preparando la foto...')

    try {
      const compressed = await compressImage(file)
      const result = await extractTotalFromImage(compressed, ({ progress: nextProgress, message }) => {
        setProgress(nextProgress)
        setProgressMessage(message)
      })

      if (!result.rawText?.trim()) {
        throw createOcrError('NO_TEXT')
      }
      if (!result.total) {
        throw createOcrError('NO_TOTAL')
      }

      setEditableAmount(formatBolivares(String(result.total).replace('.', ',')))
      setProgress(100)
      setState(OCR_STATE.SUCCESS)
    } catch (err) {
      console.error('[CameraCapture] OCR falló:', err)
      setErrorMessage(OCR_ERROR_MESSAGES[err?.code] || OCR_ERROR_MESSAGES.TESSERACT)
      setState(OCR_STATE.FAILURE)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleConfirm() {
    const amount = parseBolivares(editableAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('Revisa el monto detectado o escríbelo manualmente.')
      setState(OCR_STATE.FAILURE)
      return
    }

    onAmountDetected?.(amount)
    resetToIdle()
  }

  function handleManualEntry() {
    resetToIdle()
    onManualEntry?.()
  }

  if (state === OCR_STATE.PROCESSING) {
    return (
      <div className="camera-capture camera-capture--card" role="status" aria-live="polite">
        <p className="camera-capture__title">🔍 Buscando el total...</p>
        <div
          className="camera-capture__progress"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <div
            className="camera-capture__progress-fill"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
        <p className="camera-capture__progress-text">
          {progressMessage || 'Primera vez: descargando escáner (~10 seg)...'}
        </p>
        <p className="camera-capture__hint">
          Esto puede tardar unos segundos la primera vez.
        </p>
      </div>
    )
  }

  if (state === OCR_STATE.SUCCESS) {
    return (
      <div className="camera-capture camera-capture--card" role="status" aria-live="polite">
        <p className="camera-capture__title">✅ Total detectado:</p>
        <input
          className="camera-capture__amount-input"
          type="text"
          inputMode="decimal"
          value={editableAmount}
          onChange={(event) => setEditableAmount(event.target.value)}
          aria-label="Monto detectado editable"
        />
        <button
          type="button"
          className="camera-capture__confirm"
          onClick={handleConfirm}
        >
          ✓ Usar este monto
        </button>
        <button
          type="button"
          className="camera-capture__secondary"
          onClick={handleScanClick}
        >
          Intentar de nuevo
        </button>
        <button
          type="button"
          className="camera-capture__manual"
          onClick={handleManualEntry}
        >
          Escribir manualmente
        </button>
        {renderFileInput()}
      </div>
    )
  }

  if (state === OCR_STATE.FAILURE) {
    return (
      <div className="camera-capture camera-capture--card camera-capture--failure" role="alert">
        <p className="camera-capture__title">😕 No encontré el total</p>
        <p className="camera-capture__message">{errorMessage || OCR_ERROR_MESSAGES.DEFAULT}</p>
        <ul className="camera-capture__tips">
          <li>Mejor luz</li>
          <li>Más cerca al total</li>
          <li>Foto más nítida</li>
        </ul>
        <button
          type="button"
          className="camera-capture__secondary"
          onClick={handleScanClick}
        >
          Intentar de nuevo
        </button>
        <button
          type="button"
          className="camera-capture__manual"
          onClick={handleManualEntry}
        >
          Escribir manualmente
        </button>
        {renderFileInput()}
      </div>
    )
  }

  return (
    <div className="camera-capture">
      <button
        type="button"
        className="camera-capture__button"
        onClick={handleScanClick}
        disabled={disabled}
      >
        <span aria-hidden="true">📸</span>
        <span>Escanear factura</span>
      </button>
      {preloadStatus === 'loading' && (
        <p className="camera-capture__preload">Descargando escáner en segundo plano...</p>
      )}
      {renderFileInput()}
    </div>
  )

  function renderFileInput() {
    return (
      <input
        ref={fileInputRef}
        className="camera-capture__file"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelected}
        aria-label="Tomar foto o escoger imagen de factura"
        disabled={disabled}
      />
    )
  }
}

async function extractTotalFromImage(imageFile, onProgress) {
  const tesseractModule = await import('tesseract.js')
  const Tesseract = tesseractModule.default || tesseractModule
  const result = await Tesseract.recognize(
    imageFile,
    'spa',
    {
      logger: (info) => {
        if (info.status === 'loading language traineddata') {
          onProgress?.({
            progress: Math.round((info.progress || 0) * 35),
            message: 'Primera vez: descargando escáner (~10 seg)...'
          })
        }
        if (info.status === 'recognizing text') {
          onProgress?.({
            progress: 35 + Math.round((info.progress || 0) * 65),
            message: 'Leyendo la factura...'
          })
        }
      }
    }
  )

  const text = result.data.text || ''
  return {
    total: findTotal(text),
    rawText: text,
    confidence: result.data.confidence
  }
}

function compressImage(file, maxWidth = 1500) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * ratio))
      canvas.height = Math.max(1, Math.round(img.height * ratio))

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(createOcrError('CAMERA'))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(url)
          resolve(blob || file)
        },
        'image/jpeg',
        0.8
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(createOcrError('CAMERA'))
    }

    img.src = url
  })
}

function createOcrError(code) {
  const err = new Error(code)
  err.code = code
  return err
}
