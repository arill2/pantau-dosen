import { Modal } from './Modal'
import { Button } from './Button'
import { InlineError } from './Feedback'

interface Props {
  terbuka: boolean
  judul: string
  pesan: string
  labelKonfirmasi: string
  memuat?: boolean
  galat?: string | null
  onBatal: () => void
  onKonfirmasi: () => void
}

export function Confirm({
  terbuka,
  judul,
  pesan,
  labelKonfirmasi,
  memuat,
  galat,
  onBatal,
  onKonfirmasi,
}: Props) {
  return (
    <Modal
      terbuka={terbuka}
      judul={judul}
      onTutup={onBatal}
      footer={
        <>
          <Button variasi="halus" onClick={onBatal}>
            Batal
          </Button>
          <Button variasi="bahaya" memuat={memuat} onClick={onKonfirmasi}>
            {labelKonfirmasi}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {galat ? <InlineError pesan={galat} /> : null}
        <p className="text-[13px] text-ink">{pesan}</p>
      </div>
    </Modal>
  )
}