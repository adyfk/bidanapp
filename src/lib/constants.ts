import { Professional, Category, GlobalService } from '@/types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'newborn', name: 'Newborn', description: 'Perawatan khusus untuk bayi baru lahir' },
  { id: 'pijat-cape', name: 'Pijat Cape', description: 'Relaksasi tubuh menyeluruh untuk memulihkan kebugaran' },
  { id: 'stroke', name: 'Stroke', description: 'Terapi pemulihan pasca stroke' },
  { id: 'sunnah', name: 'Sunnah', description: 'Pengobatan preventif dan kuratif sesuai syariat' }
];

export const MOCK_SERVICES: GlobalService[] = [
  { id: 's1', slug: 'pijat-bayi', name: 'Pijat Bayi', categoryId: 'newborn', description: 'Membantu tumbuh kembang dan relaksasi bayi Anda melalui pijatan lembut yang aman.' },
  { id: 's2', slug: 'cukur-rambut-bayi', name: 'Cukur Rambut Bayi', categoryId: 'newborn', description: 'Proses cukur rambut pertama bayi dengan standar kebersihan tinggi dan profesional.' },
  { id: 's3', slug: 'pijat-full-body', name: 'Pijat Full Body', categoryId: 'pijat-cape', description: 'Pijat seluruh tubuh untuk menghilangkan penat, stres, dan kelelahan otot.' },
  { id: 's4', slug: 'bekam', name: 'Bekam', categoryId: 'sunnah', description: 'Terapi bekam kebugaran sterilisasi medis standar tinggi untuk mendetoksifikasi tubuh.' },
  { id: 's5', slug: 'konsultasi-laktasi', name: 'Konsultasi Laktasi', categoryId: 'newborn', description: 'Bantuan profesional untuk ibu menyusui.' },
  { id: 's6', slug: 'terapi-gerak-stroke', name: 'Terapi Gerak Motorik', categoryId: 'stroke', description: 'Latihan motorik rutin untuk membantu penderita stroke mengembalikan fungsi saraf dan otot.' }
];

export const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    slug: 'omeya-sen',
    name: 'Omeya Sen',
    categoryId: 'newborn',
    location: 'BidanCare Center',
    rating: 5.0,
    reviews: '120+',
    experience: '8+',
    clientsServed: '200+',
    image: 'https://images.unsplash.com/photo-1594824416928-859427b3d3ab?q=80&w=150&auto=format&fit=crop',
    about: 'Profesional berpengalaman yang berdedikasi tinggi untuk memberikan pelayanan terbaik bagi Anda dan buah hati.',
    services: [
      { serviceId: 's1', duration: '45 min', price: 'Rp 150.000' }, // Pijat Bayi
      { serviceId: 's2', duration: '30 min', price: 'Rp 85.000' },  // Cukur Rambut
      { serviceId: 's5', duration: '1 hr', price: 'Rp 200.000' }    // Konsultasi Laktasi
    ]
  },
  {
    id: '2',
    slug: 'alex-ben',
    name: 'Alex Ben',
    categoryId: 'sunnah',
    location: 'BidanCare Home',
    rating: 4.8,
    reviews: '95+',
    experience: '6+',
    clientsServed: '150+',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=150&auto=format&fit=crop',
    about: 'Terapis bersertifikat yang siap membantu kebutuhan kebugaran dan terapi sunnah Anda secara profesional.',
    services: [
      { serviceId: 's4', duration: '60 min', price: 'Rp 120.000' }, // Bekam
      { serviceId: 's3', duration: '90 min', price: 'Rp 180.000' }  // Pijat Full Body
    ]
  },
  {
    id: '3',
    slug: 'martha-stewart',
    name: 'Martha Teria',
    categoryId: 'stroke',
    location: 'BidanCare Mobile',
    rating: 4.9,
    reviews: '60+',
    experience: '12+',
    clientsServed: '300+',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=150&auto=format&fit=crop',
    about: 'Spesialis fisioterapi pemulihan pasca operasi dan stroke dengan pengalaman puluhan tahun.',
    services: [
      { serviceId: 's6', duration: '60 min', price: 'Rp 250.000' }, // Terapi Gerak
      { serviceId: 's3', duration: '60 min', price: 'Rp 150.000' }  // Pijat Full Body
    ]
  }
];
