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
    location: 'Gauthier, Casablanca',
    mapUrl: 'https://maps.google.com/?q=La+Bodega+Casablanca'
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
    location: 'Old Medina, Casablanca',
    mapUrl: 'https://maps.google.com/?q=Ricks+Cafe+Casablanca'
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
    location: 'Centre Ville, Rabat',
    mapUrl: 'https://maps.google.com/?q=Le+Grand+Comptoir+Rabat'
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
    location: 'Gueliz, Marrakech',
    mapUrl: 'https://maps.google.com/?q=Cafe+de+la+Poste+Marrakech'
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
    location: 'Twin Center, Casablanca',
    mapUrl: 'https://maps.google.com/?q=Sky+28+Casablanca'
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
    location: 'Marshane, Tangier',
    mapUrl: 'https://maps.google.com/?q=Cafe+Hafa+Tangier'
  },
  {
    id: 'p7',
    name: 'Sindibad Park',
    city: 'الدار البيضاء',
    type: 'نشاط',
    priceLevel: 2,
    vibe: ['مغامر', 'اجتماعي'],
    imageUrl: 'https://picsum.photos/seed/sindibad/800/600',
    rating: 4.2,
    location: 'Ain Diab, Casablanca',
    mapUrl: 'https://maps.google.com/?q=Sindibad+Park+Casablanca'
  },
  {
    id: 'p8',
    name: 'Marina Agadir',
    city: 'أكادير',
    type: 'تسارية',
    priceLevel: 3,
    vibe: ['هادي', 'اجتماعي'],
    imageUrl: 'https://picsum.photos/seed/marina/800/600',
    rating: 4.6,
    location: 'Marina, Agadir',
    mapUrl: 'https://maps.google.com/?q=Marina+Agadir'
  },
  {
    id: 'p9',
    name: 'Jnan Sbil',
    city: 'فاس',
    type: 'تسارية',
    priceLevel: 1,
    vibe: ['هادي'],
    imageUrl: 'https://picsum.photos/seed/jnansbil/800/600',
    rating: 4.8,
    location: 'Medina, Fez',
    mapUrl: 'https://maps.google.com/?q=Jnan+Sbil+Fez'
  },
  {
    id: 'p10',
    name: 'Oasiria Water Park',
    city: 'مراكش',
    type: 'حركة',
    priceLevel: 3,
    vibe: ['مغامر', 'اجتماعي'],
    imageUrl: 'https://picsum.photos/seed/oasiria/800/600',
    rating: 4.5,
    location: 'Route d\'Amizmiz, Marrakech',
    mapUrl: 'https://maps.google.com/?q=Oasiria+Water+Park+Marrakech'
  }
];

export const CITIES = ['الدار البيضاء', 'الرباط', 'مراكش', 'طنجة', 'أكادير', 'فاس'];
export const INTERESTS = ['قهاوي', 'ريسطورات', 'نشاط', 'فخامة', 'أنشطة', 'سهرات', 'ثقافة', 'رياضة', 'ألعاب', 'سينما', 'موسيقى', 'طبيعة', 'تصوير'];
export const PERSONALITIES = ['هادي', 'اجتماعي', 'مغامر'];
export const ACTIVITIES = ['قهوة', 'ماكلة', 'نشاط', 'حركة', 'تسارية'];
