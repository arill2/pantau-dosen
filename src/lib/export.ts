import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatPersen, formatTanggal } from './format'
import {
  cocokBulan,
  TOTAL_MINGGU,
  type BarisTanggal,
  type FilterBulan,
} from './attendance'
import type { RekapBaris, StatusPertemuan } from './types'

const KODE_STATUS: Record<StatusPertemuan, string> = {
  hadir: 'H',
  tidak_hadir: 'TH',
  belum: '-',
  izin: 'I',
  pengganti: 'P',
}

const LABEL_STATUS: Record<StatusPertemuan, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak hadir',
  belum: 'Belum terlaksana',
  izin: 'Izin',
  pengganti: 'Pengganti',
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
      Kelas: item.kelas?.nama ?? '–',
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
    { wch: 14 },
    { wch: 9 },
    ...Array.from({ length: TOTAL_MINGGU }, () => ({ wch: 4 })),
    { wch: 11 },
    { wch: 14 },
  ]

  const info = XLSX.utils.aoa_to_sheet([
    ['Rekap Monitoring Pembelajaran'],
    [`TAHUN AJARAN: ${konteks.periodeNama}`],
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
  doc.text(`TAHUN AJARAN: ${konteks.periodeNama}`, 40, 58)
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
    'N 1 A - N 1 O',
    'T/P',
    ...Array.from({ length: TOTAL_MINGGU }, (_, i) => String(i + 1)),
    'TOTAL PERTEMUAN',
    'PERSENTASE %',
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
      item.kelas?.nama ?? '–',
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
      0: { cellWidth: 95 },
      1: { cellWidth: 95 },
      2: { cellWidth: 62 },
      3: { cellWidth: 24, halign: 'center' },
      ...Object.fromEntries(
        Array.from({ length: TOTAL_MINGGU }, (_, i) => [
          i + 4,
          { cellWidth: 17, halign: 'center' },
        ]),
      ),
      20: { cellWidth: 58, halign: 'center' },
      21: { cellWidth: 52, halign: 'center' },
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

// ---------------------------------------------------------------------------
// Ekspor per tanggal
// ---------------------------------------------------------------------------
interface KonteksTanggal {
  periodeNama: string
}

export function eksporExcelTanggal(
  baris: BarisTanggal[],
  tanggal: string,
  konteks: KonteksTanggal,
) {
  const data = baris.map(({ penugasan, pertemuan }) => ({
    Dosen: penugasan.dosen?.nama ?? '–',
    'Mata Kuliah': penugasan.mata_kuliah
      ? `${penugasan.mata_kuliah.kode} · ${penugasan.mata_kuliah.nama}`
      : '–',
    Kelas: penugasan.kelas?.nama ?? '–',
    Metode: penugasan.metode === 'T' ? 'Teori' : 'Praktik',
    Pekan: pertemuan.minggu_ke,
    Tanggal: formatTanggal(pertemuan.tanggal),
    Status: LABEL_STATUS[pertemuan.status],
    Catatan: pertemuan.catatan ?? '',
  }))

  const sheet = XLSX.utils.json_to_sheet(data)
  sheet['!cols'] = [
    { wch: 26 },
    { wch: 30 },
    { wch: 14 },
    { wch: 9 },
    { wch: 7 },
    { wch: 12 },
    { wch: 16 },
    { wch: 40 },
  ]

  const info = XLSX.utils.aoa_to_sheet([
    ['Rekap Kehadiran Dosen per Tanggal'],
    [`TAHUN AJARAN: ${konteks.periodeNama}`],
    [`Tanggal: ${formatTanggal(tanggal)}`],
    ['H = Hadir, TH = Tidak hadir, I = Izin, P = Pengganti, - = Belum terlaksana'],
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, info, 'Info')
  XLSX.utils.book_append_sheet(wb, sheet, 'Rekap Tanggal')
  XLSX.writeFile(
    wb,
    `rekap-${slug(konteks.periodeNama)}-${slug(tanggal)}.xlsx`,
  )
}

export function eksporPdfTanggal(
  baris: BarisTanggal[],
  tanggal: string,
  konteks: KonteksTanggal,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Rekap Kehadiran Dosen per Tanggal', 40, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(`TAHUN AJARAN: ${konteks.periodeNama}`, 40, 58)
  doc.text(
    `Tanggal: ${formatTanggal(tanggal)} · ${baris.length} pertemuan`,
    40,
    70,
  )

  const head = [
    'Dosen',
    'Mata Kuliah',
    'Kelas',
    'T/P',
    'Pekan',
    'Status',
    'Catatan',
  ]

  const body = baris.map(({ penugasan, pertemuan }) => [
    penugasan.dosen?.nama ?? '–',
    penugasan.mata_kuliah?.nama ?? '–',
    penugasan.kelas?.nama ?? '–',
    penugasan.metode,
    String(pertemuan.minggu_ke),
    LABEL_STATUS[pertemuan.status],
    pertemuan.catatan ?? '–',
  ])

  autoTable(doc, {
    head: [head],
    body,
    startY: 84,
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineColor: [210, 205, 195],
      lineWidth: 0.4,
    },
    headStyles: { fillColor: [178, 58, 30], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 244, 239] },
    columnStyles: {
      0: { cellWidth: 115 },
      1: { cellWidth: 140 },
      2: { cellWidth: 65 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 42, halign: 'center' },
      5: { cellWidth: 75 },
      6: { cellWidth: 290 },
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

  doc.save(`rekap-${slug(konteks.periodeNama)}-${slug(tanggal)}.pdf`)
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}