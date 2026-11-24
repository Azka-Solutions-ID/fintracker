import {
  AksesibilitasModule,
  AnggaranModule,
  BadgeModule,
  BookkeepingApp,
  CicilanModule,
  EksporModule,
  GajianModule,
  GrafikModule,
  IconCalendar,
  IconCard,
  IconChart,
  IconDownload,
  IconHelp,
  IconList,
  IconMenu,
  IconHeart,
  IconPie,
  IconScale,
  IconStar,
  IconTag,
  IconTarget,
  IconWallet,
  KategoriModule,
  KesehatanModule,
  ScanStrukModule,
  SinkronModule,
  SplitBillModule,
  TanyaModule,
  LimaTigaDuaModule,
  TujuanModule,
  UtangModule,
  type Category,
  type ModuleDef,
  type Phase3Item,
  type Vocab,
  type Wallet,
} from "@sidp/ui";

const WALLETS: Wallet[] = [
  { id: "kerja", name: "Uang Kerja", hint: "Bensin, kuota, servis, alat kerja" },
  { id: "pribadi", name: "Uang Pribadi", hint: "Makan, sewa, kebutuhan rumah" },
];

const VOCAB: Vocab = { masuk: "Pendapatan", keluar: "Pengeluaran", laba: "Sisa hari ini", minus: "Kurang hari ini" };

const CATEGORIES: Category[] = [
  { id: "order", name: "Order / upah", kind: "masuk" },
  { id: "bonus", name: "Bonus / tip", kind: "masuk" },
  { id: "bensin", name: "Bensin", kind: "keluar" },
  { id: "kuota", name: "Kuota & pulsa", kind: "keluar" },
  { id: "makan", name: "Makan", kind: "keluar" },
  { id: "sewa", name: "Sewa & tagihan", kind: "keluar" },
];

/** Anggaran and Cicilan are the daily opens for a worker; the rest sit in the Fitur hub. */
const MODULES: ModuleDef[] = [
  {
    id: "anggaran",
    name: "Anggaran harian",
    note: "Batas belanja per kategori",
    group: "atur",
    icon: <IconTarget />,
    render: (props) => <AnggaranModule {...props} />,
  },
  {
    id: "cicilan",
    name: "Cicilan aman",
    note: "Batas 30% dari penghasilan",
    group: "atur",
    icon: <IconCard />,
    render: (props) => <CicilanModule {...props} />,
  },
  {
    id: "utang",
    name: "Utang & piutang",
    note: "Pinjaman dan uang yang dipinjam",
    group: "atur",
    icon: <IconScale />,
    render: (props) => <UtangModule {...props} />,
  },
  {
    id: "tujuan",
    name: "Tujuan menabung",
    note: "Dana darurat dan rencana besar",
    group: "atur",
    icon: <IconWallet />,
    render: (props) => <TujuanModule {...props} />,
  },
  {
    id: "kategori",
    name: "Kategori",
    note: "Tambah kategori sendiri",
    group: "atur",
    icon: <IconTag />,
    render: (props) => <KategoriModule {...props} />,
  },
  {
    id: "scan",
    name: "Scan struk",
    note: "Baca total dari teks struk",
    group: "atur",
    icon: <IconList />,
    render: (props) => <ScanStrukModule {...props} />,
  },
  {
    id: "split",
    name: "Split bill",
    note: "Bagi tagihan rata dan pas",
    group: "atur",
    icon: <IconPie />,
    render: (props) => <SplitBillModule {...props} />,
  },
  {
    id: "grafik",
    name: "Grafik mingguan",
    note: "Hari ramai dan hari sepi",
    group: "lihat",
    icon: <IconChart />,
    render: (props) => <GrafikModule {...props} />,
  },
  {
    id: "kesehatan",
    name: "Kesehatan keuangan",
    note: "Skor 0–100 dengan alasan",
    group: "lihat",
    icon: <IconHeart />,
    render: (props) => <KesehatanModule {...props} />,
  },
  {
    id: "lima",
    name: "Aturan 50/30/20",
    note: "Kebutuhan, keinginan, tabungan",
    group: "lihat",
    icon: <IconPie />,
    render: (props) => <LimaTigaDuaModule {...props} />,
  },
  {
    id: "gajian",
    name: "Siklus setoran",
    note: "Batas belanja harian",
    group: "lihat",
    icon: <IconCalendar />,
    render: (props) => <GajianModule {...props} />,
  },
  {
    id: "tanya",
    name: "Tanya catatan",
    note: "Jawaban dari angka sendiri",
    group: "alat",
    icon: <IconMenu />,
    render: (props) => <TanyaModule {...props} />,
  },
  {
    id: "badge",
    name: "Pencapaian",
    note: "Penanda kebiasaan mencatat",
    group: "alat",
    icon: <IconStar />,
    render: (props) => <BadgeModule {...props} />,
  },
  {
    id: "sinkron",
    name: "Sinkronisasi",
    note: "Antrean kirim & mode data",
    group: "alat",
    icon: <IconDownload />,
    render: (props) => <SinkronModule {...props} />,
  },
  {
    id: "ekspor",
    name: "Ekspor data",
    note: "Unduh CSV atau cetak PDF",
    group: "alat",
    icon: <IconDownload />,
    render: (props) => <EksporModule {...props} />,
  },
  {
    id: "aksesibilitas",
    name: "Aksesibilitas",
    note: "Pernyataan WCAG 2.2 AA dan rujukannya",
    group: "alat",
    icon: <IconHelp />,
    render: (props) => <AksesibilitasModule {...props} />,
  },
];

const PHASE3: Phase3Item[] = [
  { name: "Akun & data antar perangkat", note: "Butuh login — belum ada di demo ini" },
  { name: "Scan struk dari foto", note: "Versi teks sudah jalan; foto butuh model OCR" },
  { name: "AI chat", note: "Versi tanpa AI sudah jalan; jawaban bebas butuh model" },
];

export default function App() {
  return (
    <BookkeepingApp
      namespace="sidp.pekerja"
      title="Catat Penghasilan"
      heading="Catat uang"
      wallets={WALLETS}
      defaultWallet="pribadi"
      vocab={VOCAB}
      categories={CATEGORIES}
      modules={MODULES}
      primary={["anggaran", "cicilan"]}
      phase3={PHASE3}
    />
  );
}
