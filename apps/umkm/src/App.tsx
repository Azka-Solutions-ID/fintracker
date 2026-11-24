import {
  AnggaranModule,
  BadgeModule,
  BookkeepingApp,
  AsetModule,
  EksporModule,
  GajianModule,
  GrafikModule,
  HppModule,
  IconCalendar,
  IconCalculator,
  IconChart,
  IconDownload,
  IconMenu,
  IconHeart,
  IconList,
  IconScale,
  IconStar,
  IconTag,
  IconTarget,
  IconPie,
  IconWallet,
  KategoriModule,
  KesehatanModule,
  ScanStrukModule,
  SinkronModule,
  TanyaModule,
  TujuanModule,
  UtangModule,
  type Category,
  type ModuleDef,
  type Phase3Item,
  type Vocab,
  type Wallet,
} from "@sidp/ui";

const WALLETS: Wallet[] = [
  { id: "usaha", name: "Kas Usaha", hint: "Untuk belanja stok dan produksi" },
  { id: "dapur", name: "Dompet Dapur", hint: "Belanja rumah, pulsa, kebutuhan pribadi" },
];

const VOCAB: Vocab = { masuk: "Uang masuk", keluar: "Uang keluar", laba: "Untung hari ini", minus: "Minus hari ini" };

const CATEGORIES: Category[] = [
  { id: "jual", name: "Penjualan", kind: "masuk" },
  { id: "jasa", name: "Jasa / ongkir", kind: "masuk" },
  { id: "bahan", name: "Bahan baku", kind: "keluar" },
  { id: "operasional", name: "Operasional", kind: "keluar" },
  { id: "rumah", name: "Kebutuhan rumah", kind: "keluar" },
];

/** Phase 2 (docs/FEATURES.md §3). Anggaran and Utang are promoted to the phone bar because they
    are the two modules this audience opens daily; the rest stay one tap away in the Fitur hub. */
const MODULES: ModuleDef[] = [
  {
    id: "anggaran",
    name: "Anggaran belanja",
    note: "Batas belanja per kategori",
    group: "atur",
    icon: <IconTarget />,
    render: (props) => <AnggaranModule {...props} />,
  },
  {
    id: "utang",
    name: "Utang & piutang",
    note: "Supplier dan bon pelanggan",
    group: "atur",
    icon: <IconScale />,
    render: (props) => <UtangModule {...props} />,
  },
  {
    id: "tujuan",
    name: "Tujuan menabung",
    note: "Beli alat, tambah stok",
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
    id: "gajian",
    name: "Siklus gajian",
    note: "Batas belanja harian",
    group: "lihat",
    icon: <IconCalendar />,
    render: (props) => <GajianModule {...props} />,
  },
  {
    id: "hpp",
    name: "Kalkulator HPP",
    note: "Harga jual dari biaya nyata",
    group: "alat",
    icon: <IconCalculator />,
    render: (props) => <HppModule {...props} />,
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
    id: "aset",
    name: "Aset usaha",
    note: "Etalase, gerobak, peralatan",
    group: "alat",
    icon: <IconPie />,
    render: (props) => <AsetModule {...props} />,
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
];

const PHASE3: Phase3Item[] = [
  { name: "Multi-pengguna per usaha", note: "Butuh akun dan hak akses — belum ada login di demo ini" },
  { name: "Scan struk dari foto", note: "Versi teks sudah jalan; foto butuh model OCR" },
  { name: "AI chat", note: "Versi tanpa AI sudah jalan; jawaban bebas butuh model" },
];

export default function App() {
  return (
    <BookkeepingApp
      namespace="sidp.umkm"
      title="Catat Keuangan"
      heading="Catat transaksi"
      wallets={WALLETS}
      defaultWallet="usaha"
      vocab={VOCAB}
      categories={CATEGORIES}
      modules={MODULES}
      primary={["anggaran", "utang"]}
      phase3={PHASE3}
    />
  );
}
