import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatPersen, formatTanggal, namaMetode, STATUS_LABEL, BULAN_SINGKAT } from './format'
import {
  cocokBulan,
  hitungPerBulan,
  hitungRekap,
  TOTAL_MINGGU,
  type AturanHitung,
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
    'Kelas',
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
      1: { cellWidth: 105 },
      2: { cellWidth: 55 },
      3: { cellWidth: 24, halign: 'center' },
      ...Object.fromEntries(
        Array.from({ length: TOTAL_MINGGU }, (_, i) => [
          i + 4,
          { cellWidth: 18, halign: 'center' },
        ]),
      ),
      20: { cellWidth: 34, halign: 'center' },
      21: { cellWidth: 42, halign: 'right' },
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

export function eksporExcelBulanan(
  baris: RekapBaris[],
  bulanList: number[],
  konteks: Konteks,
  aturan: AturanHitung,
) {
  const data = baris.map((item) => {
    const row: Record<string, string | number> = {
      Dosen: item.dosen?.nama ?? '–',
      'Mata Kuliah': item.mata_kuliah
        ? `${item.mata_kuliah.kode} · ${item.mata_kuliah.nama}`
        : '–',
      Kelas: item.kelas?.nama ?? '–',
      Metode: item.metode === 'T' ? 'Teori' : 'Praktik',
    }
    for (const r of hitungPerBulan(item, bulanList, aturan)) {
      const label = BULAN_SINGKAT[r.bulan]
      row[`${label} Hadir`] = r.adaData ? r.totalHadir : ''
      row[`${label} (%)`] =
        r.adaData && r.persentase !== null ? r.persentase : ''
    }
    const total = hitungRekap(item, 'semua', aturan)
    row['Total Hadir'] = total.totalHadir
    row['Persentase (%)'] = total.persentase ?? ''
    return row
  })

  const sheet = XLSX.utils.json_to_sheet(data)
  const info = XLSX.utils.aoa_to_sheet([
    ['Rekap Kehadiran Dosen per Bulan'],
    [`Periode: ${konteks.periodeNama}`],
    ['Kolom "<Bulan> (%)" = persentase kehadiran pada bulan tersebut.'],
    ['Kolom "<Bulan> Hadir" = jumlah pertemuan hadir pada bulan tersebut.'],
  ])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, info, 'Info')
  XLSX.utils.book_append_sheet(wb, sheet, 'Rekap Bulanan')
  XLSX.writeFile(wb, `rekap-bulanan-${slug(konteks.periodeNama)}.xlsx`)
}

export function eksporPdfBulanan(
  baris: RekapBaris[],
  bulanList: number[],
  konteks: Konteks,
  aturan: AturanHitung,
  persentaseRata: number | null,
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: bulanList.length > 7 ? 'a3' : 'a4',
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Rekap Kehadiran Dosen per Bulan', 40, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(`Periode: ${konteks.periodeNama}`, 40, 58)
  doc.text(
    persentaseRata === null
      ? 'Rata-rata persentase: –'
      : `Rata-rata persentase keseluruhan: ${formatPersen(persentaseRata)}`,
    40,
    70,
  )

  const head = [
    'Dosen',
    'Mata Kuliah',
    'Kelas',
    'T/P',
    ...bulanList.map((b) => BULAN_SINGKAT[b]),
    'Total',
  ]

  const body = baris.map((item) => {
    const per = hitungPerBulan(item, bulanList, aturan)
    const total = hitungRekap(item, 'semua', aturan)
    return [
      item.dosen?.nama ?? '–',
      item.mata_kuliah?.nama ?? '–',
      item.kelas?.nama ?? '–',
      item.metode,
      ...per.map((r) =>
        r.adaData
          ? `${formatPersen(r.persentase)} (${r.totalHadir}/${r.totalDihitung})`
          : '–',
      ),
      `${formatPersen(total.persentase)} (${total.totalHadir}/${total.totalDihitung})`,
    ]
  })

  autoTable(doc, {
    head: [head],
    body,
    startY: 84,
    styles: {
      fontSize: 7,
      cellPadding: 3,
      lineColor: [210, 205, 195],
      lineWidth: 0.4,
    },
    headStyles: { fillColor: [178, 58, 30], textColor: 255, fontSize: 7 },
    alternateRowStyles: { fillColor: [247, 244, 239] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 110 },
      2: { cellWidth: 55 },
      3: { cellWidth: 24, halign: 'center' },
      ...Object.fromEntries(
        bulanList.map((_, i) => [i + 4, { cellWidth: 70, halign: 'center' }]),
      ),
      [bulanList.length + 4]: { cellWidth: 84, halign: 'right' },
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

  doc.save(`rekap-bulanan-${slug(konteks.periodeNama)}.pdf`)
}

export { KODE_STATUS, STATUS_LABEL, namaMetode }

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}