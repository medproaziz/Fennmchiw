/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Place } from './types';

export const MOCK_PLACES: Place[] = [
  {
    id: 'p1',
    name: 'La Bodega',
    city: 'الدار البيضاء',
    type: 'ماكلة',
    priceLevel: 3,
    vibe: ['اجتماعي', 'مغامر'],
    imageUrl: 'https://picsum.photos/seed/bodega/800/600',
    rating: 4.5,
    location: 'Gauthier, Casablanca'
  },
  {
    id: 'p2',
    name: 'Rick\'s Café',
    city: 'الدار البيضاء',
    type: 'قهوة',
    priceLevel: 4,
    vibe: ['هادي', 'اجتماعي'],
    imageUrl: 'https://picsum.photos/seed/ricks/800/600',
    rating: 4.8,
    location: 'Old Medina, Casablanca'
  },
  {
    id: 'p3',
    name: 'Le Grand Comptoir',
    city: 'الرباط',
    type: 'ماكلة',
    priceLevel: 3,
    vibe: ['اجتماعي'],
    imageUrl: 'https://picsum.photos/seed/comptoir/800/600',
    rating: 4.4,
    location: 'Centre Ville, Rabat'
  },
  {
    id: 'p4',
    name: 'Café de la Poste',
    city: 'مراكش',
    type: 'قهوة',
    priceLevel: 3,
    vibe: ['اجتماعي', 'هادي'],
    imageUrl: 'https://picsum.photos/seed/poste/800/600',
    rating: 4.6,
    location: 'Gueliz, Marrakech'
  },
  {
    id: 'p5',
    name: 'Sky 28',
    city: 'الدار البيضاء',
    type: 'تسارية',
    priceLevel: 4,
    vibe: ['اجتماعي', 'مغامر'],
    imageUrl: 'https://picsum.photos/seed/sky28/800/600',
    rating: 4.7,
    location: 'Twin Center, Casablanca'
  },
  {
    id: 'p6',
    name: 'Café Hafa',
    city: 'طنجة',
    type: 'قهوة',
    priceLevel: 1,
    vibe: ['هادي', 'مغامر'],
    imageUrl: 'https://picsum.photos/seed/hafa/800/600',
    rating: 4.9,
    location: 'Marshane, Tangier'
  }
];

export const CITIES = ['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'أكادير', 'فاس'];
export const INTERESTS = ['قهاوي', 'ريسطورات', 'نشاط', 'فخامة', 'أنشطة', 'سهرات', 'ثقافة'];
export const PERSONALITIES = ['هادي', 'اجتماعي', 'مغامر'];
export const ACTIVITIES = ['قهوة', 'ماكلة', 'نشاط', 'حركة', 'تسارية'];
