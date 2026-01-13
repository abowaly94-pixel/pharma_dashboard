// مجموعة من الصور الافتراضية للأدوية من Unsplash
export const medicineImages = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop', // أقراص بيضاء
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop', // كبسولات ملونة
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop', // أقراص وردية
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop', // فيتامينات
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop', // أدوية متنوعة
  'https://images.unsplash.com/photo-1585435557343-3b092031d4c1?w=400&h=300&fit=crop', // شراب دواء
  'https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop', // أقراص زرقاء
  'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400&h=300&fit=crop', // كبسولات شفافة
  'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=300&fit=crop', // أدوية في علبة
  'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop', // أقراص ملونة
];

// دالة للحصول على صورة عشوائية
export const getRandomMedicineImage = () => {
  return medicineImages[Math.floor(Math.random() * medicineImages.length)];
};

// دالة للحصول على صورة حسب فئة الدواء
export const getMedicineImageByCategory = (category: string) => {
  const categoryImages: { [key: string]: string } = {
    'مسكنات': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    'مضادات حيوية': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    'فيتامينات': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    'مضادات الحساسية': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop',
    'أدوية القلب': 'https://images.unsplash.com/photo-1550572017-edd951aa8ca6?w=400&h=300&fit=crop',
    'أدوية الجهاز الهضمي': 'https://images.unsplash.com/photo-1585435557343-3b092031d4c1?w=400&h=300&fit=crop',
  };
  
  return categoryImages[category] || getRandomMedicineImage();
};

// صورة افتراضية عامة للأدوية
export const defaultMedicineImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop';