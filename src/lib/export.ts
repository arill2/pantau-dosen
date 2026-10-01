import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatPersen, formatTanggal, namaMetode, STATUS_LABEL } from './format'
import { cocokBulan, TOTAL_MINGGU, type FilterBulan } from './attendance'
import type { RekapBaris, StatusPertemuan } from './types'

const KODE_STATUS: Record<StatusPertemuan, string> = {
  hadir: 'H',
  tidak_hadir: 'TH',
  belum: '-',
  izin: 'I',
  pengganti: 'P',
}

interface Konteks {
  periodeNama: string
  bulanLabel: string
}

function barisEkspor(baris: RekapBaris[], bulan: FilterBulan) {
  return baris.map((item) => {
    const perMinggu: Record<number, string> = {}
    for (const p of item.pertemuan) {
      if (cocokBulan(p, bulan)) perMinggu[p.minggu_ke] = KODE_STATUS[p.status]
    }
    const minggu: Record<string, string> = {}
    for (let i = 1; i <= TOTAL_MINGGU; i += 1) {
      minggu[`P${i}`] = perMinggu[i] ?? '-'
    }
    return {
      Dosen: item.dosen?.nama ?? '–',
      'Mata Kuliah': item.mata_kuliah
        ? `${item.mata_kuliah.kode} · ${item.mata_kuliah.nama}`
        : '–',
      Metode: item.metode === 'T' ? 'Teori' : 'Praktik',
      ...minggu,
      'Total Hadir': item.totalHadir,
      'Persentase (%)': item.persentase ?? '',
    }
  })
}

export function eksporExcel(
  baris: RekapBaris[],
  bulan: FilterBulan,
  konteks: Konteks,
) {
  const data = barisEkspor(baris, bulan)
  const sheet = XLSX.utils.json_to_sheet(data)
  sheet['!cols'] = [
    { wch: 26 },
    { wch: 30 },
    { wch: 9 },
    ...Array.from({ length: TOTAL_MINGGU }, () => ({ wch: 4 })),
    { wch: 11 },
    { wch: 14 },
  ]

  const info = XLSX.utils.aoa_to_sheet([
    ['Rekap Monitoring Pembelajaran'],
    [`Periode: ${konteks.periodeNama}`],
    [`Bulan: ${konteks.bulanLabel}`],
    ['H = Hadir, TH = Tidak hadir, I = Izin, P = Pengganti, - = Belum terlaksana'],
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, info, 'Info')
  XLSX.utils.book_append_sheet(wb, sheet, 'Rekap')
  XLSX.writeFile(wb, `rekap-${slug(konteks.periodeNama)}-${slug(konteks.bulanLabel)}.xlsx`)
}

export function eksporPdf(
  baris: RekapBaris[],
  bulan: FilterBulan,
  konteks: Konteks,
  persentaseRata: number | null,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Rekap Monitoring Pembelajaran Taruna', 40, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(`Periode: ${konteks.periodeNama}`, 40, 58)
  doc.text(`Bulan: ${konteks.bulanLabel}`, 40, 70)
  doc.text(
    persentaseRata === null
      ? 'Rata-rata persentase: –'
      : `Rata-rata persentase: ${formatPersen(persentaseRata)}`,
    40,
    82,
  )

  const head = [
    'Dosen',
    'Mata Kuliah',
    'T/P',
    ...Array.from({ length: TOTAL_MINGGU }, (_, i) => String(i + 1)),
    'Total',
    '%',
  ]

  const body = baris.map((item) => {
    const kolom: string[] = []
    for (let i = 1; i <= TOTAL_MINGGU; i += 1) {
      const p = item.pertemuan.find((x) => x.minggu_ke === i)
      kolom.push(p && cocokBulan(p, bulan) ? KODE_STATUS[p.status] : '-')
    }
    return [
      item.dosen?.nama ?? '–',
      item.mata_kuliah?.nama ?? '–',
      item.metode,
      ...kolom,
      String(item.totalHadir),
      formatPersen(item.persentase),
    ]
  })

  autoTable(doc, {
    head: [head],
    body,
    startY: 96,
    styles: { fontSize: 7, cellPadding: 3, lineColor: [210, 205, 195], lineWidth: 0.4 },
    headStyles: { fillColor: [178, 58, 30], textColor: 255, fontSize: 7 },
    alternateRowStyles: { fillColor: [247, 244, 239] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 120 },
      2: { cellWidth: 24, halign: 'center' },
      ...Object.fromEntries(
        Array.from({ length: TOTAL_MINGGU }, (_, i) => [
          i + 3,
          { cellWidth: 18, halign: 'center' },
        ]),
      ),
      19: { cellWidth: 34, halign: 'center' },
      20: { cellWidth: 42, halign: 'right' },
    },
    didDrawPage: () => {
      const page = doc.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(120)
      doc.text(
        `Dicetak ${formatTanggal(new Date().toISOString().slice(0, 10))} · halaman ${page}`,
        40,
        doc.internal.pageSize.getHeight() - 18,
      )
    },
  })

  doc.save(`rekap-${slug(konteks.periodeNama)}-${slug(konteks.bulanLabel)}.pdf`)
}

export { KODE_STATUS, STATUS_LABEL, namaMetode }

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}