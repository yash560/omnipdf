import assert from 'node:assert';
import { generateSmartDossiers } from '../../lib/drive/dossier-generator';
import { DriveItem } from '../../lib/drive/drive-types';

export async function runDossierTests() {
  console.log('🧪 Testing [dossier-generator.ts]...');

  const items = [
    {
      id: 'c1',
      name: 'Job Offer Letter - Google.pdf',
      type: 'file',
      size: 150000,
      createdAt: 100,
      updatedAt: 100,
      tags: ['offer letter', 'career', 'employment'],
      aiCategory: 'Employment & Career',
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'c2',
      name: 'Experience & Relieving Certificate.pdf',
      type: 'file',
      size: 120000,
      createdAt: 200,
      updatedAt: 200,
      tags: ['relieving letter', 'career'],
      aiCategory: 'Employment & Career',
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'c3',
      name: 'Salary Slip July 2024.pdf',
      type: 'file',
      size: 90000,
      createdAt: 300,
      updatedAt: 300,
      tags: ['salary slip', 'payroll'],
      aiCategory: 'Employment & Career',
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'v1',
      name: 'Honda Amaze Certificate of Registration.pdf',
      type: 'file',
      size: 400000,
      createdAt: 400,
      updatedAt: 400,
      tags: ['vehicle', 'amaze', 'rc'],
      aiCategory: 'Vehicle & Transport',
      isStarred: false,
      isTrash: false,
    },
    {
      id: 'v2',
      name: 'Honda Amaze Insurance Policy.pdf',
      type: 'file',
      size: 300000,
      createdAt: 500,
      updatedAt: 500,
      tags: ['vehicle', 'insurance'],
      aiCategory: 'Vehicle & Transport',
      isStarred: false,
      isTrash: false,
    },
  ] as unknown as DriveItem[];

  const dossiers = generateSmartDossiers(items);
  assert.ok(dossiers.length >= 2, 'Should generate at least Career and Vehicle dossiers');

  const careerDossier = dossiers.find((d) => d.id === 'dossier_career_master');
  assert.ok(careerDossier, 'Career dossier should exist');
  assert.strictEqual(careerDossier?.completenessScore, 100, 'Career dossier with Offer + Relieving + Salary should have 100% completeness');
  assert.strictEqual(careerDossier?.items.length, 3);

  const vehicleDossier = dossiers.find((d) => d.id === 'dossier_vehicle_kit');
  assert.ok(vehicleDossier, 'Vehicle dossier should exist');
  assert.strictEqual(vehicleDossier?.items.length, 2);

  console.log('  ✅ [dossier-generator.ts] passed all assertions.');
}
