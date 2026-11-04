// Seeds demo listings through the public API (no direct DB access needed).
// Re-running updates listings with the same title instead of duplicating them.
//
// Usage: node scripts/seed-demo.js <api-base-url> <email> <password>
//   e.g. node scripts/seed-demo.js https://qwako-six.vercel.app/api demo@qwako.dev demo1234
// Prices are per night in the local currency of each listing's country.

const [, , BASE = 'http://localhost:4000', EMAIL, PASSWORD] = process.argv;
if (!EMAIL || !PASSWORD) {
  console.error('Usage: node scripts/seed-demo.js <api-base-url> <email> <password>');
  process.exit(1);
}

// Unsplash photos (index -> id), checked to load
const P = `1564013799919-ab600027ffc6 1568605114967-8130f3a36994 1570129477492-45c003edd2be 1580587771525-78b9dba3b914 1512917774080-9991f1c4c750 1613490493576-7fde63acd811 1600596542815-ffad4c1539a9 1600585154340-be6161a56a0c 1600607687939-ce8a6c25118c 1600566753190-17f0baa2a6c3 1600047509807-ba8f99d2cdde 1605276374104-dee2a0ed3cd6 1502005229762-cf1b2da7c5d6 1522708323590-d24dbb6b0267 1560448204-e02f11c3d0e2 1493809842364-78817add7ffb 1484154218962-a197022b5858 1505691938895-1758d7feb511 1522771739844-6a9f6d5f14af 1540518614846-7eded433c457 1556020685-ae41abfc9365 1571896349842-33c89424de2d 1566073771259-6a8506099945 1582719478250-c89cae4dc85b 1520250497591-112f2f40a3f4 1499793983690-e29da59ef1c2 1449158743715-0a90ebb6d2d8 1502672260266-1c1ef2d93688 1510798831971-661eb04b3739 1542718610-a1d656d1884c 1587061949409-02df41d5e562 1475855581690-80accde3ae2b 1518780664697-55e3ad937233 1576941089067-2de3c901e126 1583608205776-bfd35f0d9f83 1572120360610-d971b9d7767c 1595877244574-e90ce41ce089 1449844908441-8829872d2607 1523217582562-09d0def993a6 1554995207-c18c203602cb 1586023492125-27b2c045efd7 1617806118233-18e1de247200 1615874959474-d609969a20ed 1631049307264-da0ec9d70304 1618773928121-c32242e63f39 1590490360182-c33d57733427 1596394516093-501ba68a0ba6 1584132967334-10e028bd69f7 1602002418082-a4443e081dd1 1537996194471-e657df975ab4 1540541338287-41700207dee6 1571003123894-1f0594d2b5d9 1545324418-cc1a3fa10c00 1574362848149-11496d93a7c7 1600210492486-724fe5c67fb0 1600121848594-d8644e57abab 1560185007-cde436f6a4d0 1560185893-a55cbc8c57e8 1501183638710-841dd1904471 1416331108676-a22ccb276e35 1430285561322-7808604715df 1464146072230-91cabc968266 1480074568708-e7b720bb3f09 1513584684374-8bab748fbf90 1512918728675-ed5a9ecdebfd 1505693416388-ac5ce068fe85 1522444195799-478538b28823 1494526585095-c41746248156 1592595896551-12b371d546d5 1599809275671-b5942cabc7a2 1600573472592-401b489a3cdc 1600585154526-990dced4db0d 1600566752355-35792bedcfea 1600607687644-c7171b42498f 1600210491892-03d54c0aaf87 1615571022219-eb45cf7faa9d 1616594039964-ae9021a400a0 1616486338812-3dadae4b4ace 1551882547-ff40c63fe5fa 1578683010236-d716f9a3f461 1611892440504-42a792e24d32 1566665797739-1674de7a421a 1595576508898-0ad5c879a061 1559599238-308793637427 1564501049412-61c2a3083791 1573843981267-be1999ff37cd 1505881502353-a1986add3762 1520608421741-68228b76b6df 1533104816931-20fa691ff6ca 1544984243-ec57ea16fe25 1523906834658-6e24ef2386f9 1549294413-26f195200c16 1516483638261-f4dbaf036963 1528127269322-539801943592 1470770841072-f978cf4d019e 1506905925346-21bda4d32df4 1501785888041-af3ef285b470`.split(' ');
const img = (i) => `https://images.unsplash.com/photo-${P[i]}?w=1200&q=80&auto=format&fit=crop`;

// [title, address, photo indexes, max guests, price per night (local currency), perks, description]
const L = [
  ['Lakeside Cabin', 'Lake Tahoe, California, USA', [26, 27, 42], 4, 180, ['wifi', 'parking'], 'Cozy log cabin among the pines, a short walk from the lake and its private dock.'],
  ['Beach Villa', 'Diani Beach, Kenya', [25, 47, 79, 13], 6, 28000, ['wifi', 'pets', 'parking'], 'Ocean-view villa steps from the white sand, with a deck made for sunsets.'],
  ['City Loft', 'Westlands, Nairobi, Kenya', [52, 8, 18], 2, 7500, ['wifi', 'tv'], 'Modern loft in the heart of Westlands, close to restaurants, malls and nightlife.'],
  ['Karen Garden Cottage', 'Karen, Nairobi, Kenya', [62, 27, 42], 4, 9500, ['wifi', 'parking', 'pets'], 'Quiet cottage in leafy Karen with a big garden, minutes from the Giraffe Centre.'],
  ['Kilimani Modern Apartment', 'Kilimani, Nairobi, Kenya', [53, 54, 57, 16], 3, 6500, ['wifi', 'tv', 'parking'], 'Bright apartment with a full kitchen and fast Wi-Fi, ideal for work trips.'],
  ['Watamu Ocean Villa', 'Watamu, Kenya', [0, 14, 19, 72], 8, 35000, ['wifi', 'parking', 'tv'], 'Spacious pool villa near Watamu Marine Park, perfect for families and groups.'],
  ['Lamu Swahili House', 'Lamu Island, Kenya', [38, 40, 45], 6, 18000, ['wifi', 'radio'], 'Whitewashed Swahili-style home in Shela, a short dhow ride from Lamu Old Town.'],
  ['Naivasha Lake Retreat', 'Naivasha, Kenya', [94, 58, 23], 6, 15000, ['parking', 'pets', 'radio'], 'Lakeside retreat with hippos at the shore and Hell\'s Gate an easy drive away.'],
  ['Nanyuki Mountain Lodge', 'Nanyuki, Kenya', [36, 74, 44], 8, 22000, ['wifi', 'parking', 'tv'], 'Timber lodge with Mount Kenya views, a fireplace and safari trips nearby.'],
  ['Malindi Pool Villa', 'Malindi, Kenya', [4, 77, 76], 10, 42000, ['wifi', 'parking', 'tv', 'pets'], 'Luxury villa with a private pool and staff, a few minutes from Malindi beach.'],
  ['Nyali Penthouse', 'Nyali, Mombasa, Kenya', [87, 39, 73], 4, 14000, ['wifi', 'tv', 'parking'], 'Top-floor penthouse with sea breezes and a wide balcony over Nyali.'],
  ['Galu Beachfront Cottage', 'Galu Beach, Diani, Kenya', [21, 13, 20], 4, 16000, ['wifi', 'pets'], 'Beachfront cottage on quiet Galu Beach, great for kitesurfing and snorkelling.'],
  ['Zanzibar Beach Bungalow', 'Nungwi, Zanzibar, Tanzania', [91, 48, 80], 4, 320000, ['wifi', 'radio'], 'Palm-shaded bungalow on Nungwi beach, with turquoise water at the door.'],
  ['Arusha Garden Villa', 'Arusha, Tanzania', [69, 41, 65], 6, 450000, ['wifi', 'parking', 'tv'], 'Garden villa with a pool, the perfect base for Serengeti and Kilimanjaro trips.'],
  ['Kololo Hillside Home', 'Kololo, Kampala, Uganda', [11, 56, 57], 6, 380000, ['wifi', 'parking', 'tv'], 'Family home on Kololo hill with city views and a quiet garden.'],
  ['Kigali Modern Townhouse', 'Kigali, Rwanda', [10, 15, 19], 4, 120000, ['wifi', 'parking'], 'Sleek townhouse in a calm neighbourhood, close to the Kigali Convention Centre.'],
  ['Camps Bay Ocean House', 'Camps Bay, Cape Town, South Africa', [5, 8, 43], 8, 6500, ['wifi', 'parking', 'tv'], 'Glass-fronted house with an infinity pool and Atlantic views under the Twelve Apostles.'],
  ['Marrakech Riad', 'Medina, Marrakech, Morocco', [59, 74, 45], 6, 2200, ['wifi', 'radio'], 'Traditional riad with a courtyard pool, tucked inside the old Medina.'],
  ['Praslin Island Hideaway', 'Praslin, Seychelles', [86, 47, 83], 2, 4500, ['wifi'], 'Romantic hideaway on Praslin with a private jetty and crystal-clear lagoon.'],
  ['Grand Baie Pool Villa', 'Grand Baie, Mauritius', [24, 77, 79], 8, 18000, ['wifi', 'parking', 'tv'], 'Tropical villa with a big pool and garden, walking distance to Grand Baie.'],
  ['Overwater Villa', 'North Malé Atoll, Maldives', [85, 48, 23], 2, 12000, ['wifi', 'tv'], 'Overwater villa with a glass floor panel and steps straight into the lagoon.'],
  ['Ubud Jungle Villa', 'Ubud, Bali, Indonesia', [49, 51, 80], 4, 2800000, ['wifi', 'parking'], 'Jungle villa with an infinity pool above the rice terraces near Ubud.'],
  ['Kamala Pool Villa', 'Kamala, Phuket, Thailand', [50, 78, 82], 6, 9500, ['wifi', 'tv', 'parking'], 'Hillside villa with a pool and sea views, a few minutes from Kamala beach.'],
  ['Ha Long Bay Retreat', 'Ha Long, Vietnam', [93, 40, 81], 2, 2500000, ['wifi', 'tv'], 'Calm retreat overlooking the limestone islands of Ha Long Bay.'],
  ['Shibuya Minimalist Apartment', 'Shibuya, Tokyo, Japan', [71, 20, 73], 2, 22000, ['wifi', 'tv'], 'Compact, design-led apartment near Shibuya Crossing and the Yamanote line.'],
  ['Goa Beach House', 'Candolim, Goa, India', [22, 13, 82], 6, 12000, ['wifi', 'parking', 'pets'], 'Laid-back beach house with a pool and loungers, close to Candolim beach.'],
  ['Dubai Marina Apartment', 'Dubai Marina, Dubai, UAE', [63, 55, 76], 4, 950, ['wifi', 'tv', 'parking'], 'High-rise apartment with marina views, near JBR beach and the tram.'],
  ['Oia Cave House', 'Oia, Santorini, Greece', [88, 47, 83], 2, 280, ['wifi'], 'Traditional cave house carved into the cliffs, famous sunsets from the terrace.'],
  ['Manarola Sea-View Apartment', 'Manarola, Cinque Terre, Italy', [92, 17, 42], 4, 190, ['wifi'], 'Colourful apartment above the harbour with views over the Ligurian Sea.'],
  ['Venice Canal Apartment', 'San Polo, Venice, Italy', [90, 74, 65], 3, 210, ['wifi', 'tv'], 'Elegant apartment on a quiet canal, a short walk from the Rialto Bridge.'],
  ['Lake Como Villa', 'Bellagio, Lake Como, Italy', [96, 58, 44], 6, 340, ['wifi', 'parking'], 'Villa with a lakeside garden and boat access in the pearl of Lake Como.'],
  ['Alfama Apartment', 'Alfama, Lisbon, Portugal', [87, 56, 18], 4, 120, ['wifi', 'tv'], 'Sunny apartment in historic Alfama, with tram 28 right outside.'],
  ['Eixample Flat', 'Eixample, Barcelona, Spain', [53, 40, 20], 4, 150, ['wifi', 'tv'], 'Stylish flat with high ceilings, minutes from Sagrada Família.'],
  ['Ibiza Sunset Villa', 'San Antonio, Ibiza, Spain', [3, 39, 79], 10, 650, ['wifi', 'parking', 'tv'], 'Modern villa with a large pool and terraces built for Ibiza sunsets.'],
  ['Le Marais Loft', 'Le Marais, Paris, France', [8, 41, 64], 2, 230, ['wifi', 'tv'], 'Chic loft in Le Marais, close to cafés, galleries and the Seine.'],
  ['Zermatt Alpine Chalet', 'Zermatt, Switzerland', [28, 74, 23], 6, 520, ['wifi', 'parking'], 'Snowy chalet with Matterhorn views, ski-in access in winter.'],
  ['Vík Red Cottage', 'Vík, Iceland', [32, 58, 66], 4, 38000, ['wifi', 'parking'], 'Little red cottage near black-sand beaches, great for northern lights.'],
  ['Lofoten Fjord Cabin', 'Lofoten, Norway', [29, 40, 57], 4, 2800, ['wifi', 'parking'], 'Cabin by the fjord under dramatic peaks, midnight sun in summer.'],
  ['Cotswolds Cottage', 'Bourton-on-the-Water, UK', [60, 77, 45], 6, 210, ['wifi', 'parking', 'pets'], 'Classic stone cottage in a picture-postcard Cotswolds village.'],
  ['Loch Lomond Lake House', 'Loch Lomond, Scotland', [61, 54, 65], 6, 180, ['wifi', 'parking', 'pets'], 'Lake house on the bonnie banks with woodland walks from the door.'],
  ['Notting Hill Townhouse', 'Notting Hill, London, UK', [33, 15, 19], 4, 260, ['wifi', 'tv'], 'Pretty townhouse near Portobello Road market and Hyde Park.'],
  ['Miami Beach Modern Villa', 'Miami Beach, Florida, USA', [6, 14, 76], 8, 650, ['wifi', 'parking', 'tv'], 'Modern villa with a pool and a short stroll to South Beach.'],
  ['Malibu Beach House', 'Malibu, California, USA', [75, 77, 83], 6, 850, ['wifi', 'parking'], 'Beach house right on the sand, with surf breaks a few steps away.'],
  ['Hamptons Farmhouse', 'East Hampton, New York, USA', [2, 74, 42], 8, 720, ['wifi', 'parking', 'pets'], 'Classic shingle farmhouse with a wraparound porch and big lawn.'],
  ['Aspen Ski Cabin', 'Aspen, Colorado, USA', [37, 58, 44], 6, 540, ['wifi', 'parking', 'tv'], 'Warm mountain cabin close to the slopes, with a stone fireplace.'],
  ['Banff Mountain Cabin', 'Banff, Alberta, Canada', [1, 27, 43], 6, 380, ['wifi', 'parking'], 'Cabin in the Rockies, close to Lake Louise and Banff hot springs.'],
  ['Tulum Jungle Villa', 'Tulum, Mexico', [89, 51, 80], 6, 6500, ['wifi', 'parking'], 'Jungle villa with a plunge pool, a bike ride from the beach and cenotes.'],
  ['Copacabana Beachfront', 'Copacabana, Rio de Janeiro, Brazil', [84, 55, 73], 4, 850, ['wifi', 'tv'], 'Beachfront apartment with views over Copacabana and Sugarloaf Mountain.'],
  ['Mosman Harbour House', 'Mosman, Sydney, Australia', [9, 8, 18], 6, 480, ['wifi', 'parking', 'tv'], 'Contemporary house near the harbour, a ferry ride from the Opera House.'],
  ['Queenstown Lake Lodge', 'Queenstown, New Zealand', [46, 58, 23], 4, 390, ['wifi', 'parking'], 'Lodge with lake and mountain views, close to skiing and adventure sports.'],
];

const EXTRA = 'Check-in from 2pm, check-out by 11am. No smoking indoors. No parties.';

const api = async (path, opts = {}, token) => {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(body)}`);
  return body;
};

(async () => {
  const { token } = await api('/user/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const mine = await api('/places/user-places', {}, token);
  const byTitle = new Map(mine.map((p) => [p.title, p._id]));

  let added = 0;
  let updated = 0;
  for (const [title, address, photos, maxGuests, price, perks, description] of L) {
    const data = {
      title,
      address,
      addedPhotos: photos.map(img),
      description,
      perks,
      extraInfo: EXTRA,
      maxGuests,
      price,
    };
    if (byTitle.has(title)) {
      await api('/places/update-place', { method: 'PUT', body: JSON.stringify({ id: byTitle.get(title), ...data }) }, token);
      updated++;
    } else {
      await api('/places/add-places', { method: 'POST', body: JSON.stringify(data) }, token);
      added++;
    }
  }
  console.log(`Done: ${added} added, ${updated} updated, ${L.length} listings total.`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
