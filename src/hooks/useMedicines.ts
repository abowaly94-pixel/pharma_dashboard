import { useState, useEffect } from 'react';
import { Medicine } from '@/types';

// Demo data based on Firebase structure
const demoMedicines: Medicine[] = [
  {
    id: '8vLjQaKOj3FvSJRw2ItM',
    name: 'Nexium',
    code: '569063',
    description: '-Esomeprazole Used for treating acid reflux and stomach ulcers It is prescribed by doctors for related conditions.',
    price: 332,
    quantity: 9,
    pharmacyId: 827457,
    pharmacyName: 'ELNADA PHARMACY',
    pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
    avgRating: 0,
    ratingCount: 0,
    discountRating: 0,
    isNewProduct: true,
    sellingCount: 0,
    reviews: [],
    subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/919f-4a8c-a6a4-ab2947d0fbc3.png'
  },
  {
    id: '9iKPCXkcyeewx948h8RS',
    name: 'Aloe Pura Gel',
    code: '355696',
    description: '- Organic Aloe Vera Aloe Pura Gel contains Organic Aloe Vera and is used for skincare or beauty enhancement. It is dermatologically tested and widely used.',
    price: 150,
    quantity: 25,
    pharmacyId: 409241,
    pharmacyName: 'ELNADA PHARMACY',
    pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
    avgRating: 4.5,
    ratingCount: 12,
    discountRating: 10,
    isNewProduct: true,
    sellingCount: 45,
    reviews: [],
    subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/aloe.png'
  },
  {
    id: 'DlpA5I91vuKvTC8B6a1c',
    name: 'Mustela Baby Cream',
    code: '380455',
    description: '- Avocado Perseose Mustela Baby Cream contains Avocado Perseose and is used for skincare or beauty enhancement. It is dermatologically tested and widely used.',
    price: 700,
    quantity: 6,
    pharmacyId: 673237,
    pharmacyName: 'ELNADA PHARMACY',
    pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
    avgRating: 0,
    ratingCount: 0,
    discountRating: 5,
    isNewProduct: true,
    sellingCount: 0,
    reviews: [],
    subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/mustela.png'
  },
  {
    id: 'GfmZCgKRw09zLTOT5KmU',
    name: 'Panadol Extra',
    code: '123456',
    description: 'Pain relief medication containing paracetamol and caffeine for headaches, migraines, and general pain.',
    price: 45,
    quantity: 100,
    pharmacyId: 827457,
    pharmacyName: 'ELNADA PHARMACY',
    pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
    avgRating: 4.8,
    ratingCount: 89,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 234,
    reviews: [],
    subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/panadol.png'
  },
  {
    id: 'H8XfUuStxqsNUG0rw9zk',
    name: 'Vitamin C 1000mg',
    code: '789012',
    description: 'High potency Vitamin C supplement for immune system support and antioxidant protection.',
    price: 120,
    quantity: 50,
    pharmacyId: 827457,
    pharmacyName: 'ELNADA PHARMACY',
    pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
    avgRating: 4.6,
    ratingCount: 56,
    discountRating: 15,
    isNewProduct: false,
    sellingCount: 178,
    reviews: [],
    subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/vitc.png'
  }
];

export function useMedicines(pharmacyId?: number) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let filteredMedicines = demoMedicines;
        if (pharmacyId) {
          filteredMedicines = demoMedicines.filter(m => m.pharmacyId === pharmacyId);
        }
        
        setMedicines(filteredMedicines);
      } catch (err) {
        setError('Failed to fetch medicines');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedicines();
  }, [pharmacyId]);

  return { medicines, isLoading, error, setMedicines };
}
