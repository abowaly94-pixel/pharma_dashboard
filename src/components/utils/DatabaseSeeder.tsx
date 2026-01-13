import { Button } from '@/components/ui/button';
import { seedFirebaseDatabase } from '@/lib/seedFirebase';
import { useState } from 'react';

export function DatabaseSeeder() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSeedDatabase = async () => {
    setLoading(true);
    setMessage('Starting to seed database...');
    try {
      await seedFirebaseDatabase();
      setMessage('Database seeded successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
      setMessage('Error seeding database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted m-4">
      <h3 className="font-bold mb-2">Database Seeder</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Click the button below to seed the database with sample data if collections are empty
      </p>
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleSeedDatabase} 
          disabled={loading}
          className="w-fit"
        >
          {loading ? 'Seeding...' : 'Seed Database'}
        </Button>
        {message && (
          <p className="text-sm mt-2 p-2 bg-background rounded border">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}