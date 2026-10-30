// ข้อมูลการ์ดทั้ง 21 ใบ (Meme Card Deck - Balanced Edition)
const CARDS_DATA = [
  {
    id: 1,
    name: "จอมหลับหน้าแนบ",
    sub: "Deep Sleeper Face",
    category: "Tank",
    categoryName: "สายหลับ/แทงค์",
    cost: 2,
    atk: 2,
    def: 5,
    skill: {
      id: "slumber_heal",
      name: "หลับไม่สนโลก",
      desc: "ฟื้นฟู HP 3 หน่วย และได้รับเกราะป้องกัน +2",
      type: "heal_shield",
      healVal: 3,
      shieldVal: 2
    },
    quote: "ต่อให้ฟ้าถล่ม ดินทลาย... ขอนอนต่ออีก 5 นาทีคร้าบ",
    image: "images/1.jpeg"
  },
  {
    id: 2,
    name: "คางสองมหาประลัย",
    sub: "Double Chin of Doom",
    category: "Tank",
    categoryName: "สายแทงค์หนา",
    cost: 3,
    atk: 2,
    def: 6,
    skill: {
      id: "chin_reflect",
      name: "เหนียงดูดซับสะท้อนกลับ",
      desc: "ได้รับเกราะ +3 และสะท้อนดาเมจ 2 หน่วยใส่ศัตรูทันที",
      type: "shield_reflect",
      shieldVal: 3,
      dmgVal: 2
    },
    quote: "ไม่ใช่เหนียงธรรมดา แต่มันคือเบาะนิรภัยส่วนตัวระดับพรีเมียม",
    image: "images/2.jpeg"
  },
  {
    id: 3,
    name: "กิกะชาดหน้าเหลี่ยม",
    sub: "Gigachad Jawline",
    category: "Fighter",
    categoryName: "สายไฟท์เตอร์/หล่อเท่",
    cost: 4,
    atk: 5,
    def: 4,
    skill: {
      id: "mewing_pierce",
      name: "มิวอิ้งสังหาร",
      desc: "โจมตีทะลุเกราะป้องกันศัตรูโดยตรง (True Damage 3 หน่วย)",
      type: "true_damage",
      dmgVal: 3
    },
    quote: "ไม่ต้องพูดเยอะ สันกรามคมจัด บาดใจเธอได้ทุกคน",
    image: "images/3.jpeg"
  },
  {
    id: 4,
    name: "เทพเจ้าโซฟาฟาสต์ฟู้ด",
    sub: "Fast Food Sofa King",
    category: "Chaos",
    categoryName: "สายปาร์ตี้ขยะ",
    cost: 3,
    atk: 3,
    def: 5,
    skill: {
      id: "grease_bomb",
      name: "อภิมหาคราบมันสะท้านโลกันตร์",
      desc: "สร้างความเสียหาย 2 หน่วย และลดพลังโจมตีศัตรู -2 ในเทิร์นถัดไป",
      type: "damage_weaken",
      dmgVal: 2,
      weakenVal: 2
    },
    quote: "พิซซ่า เบอร์เกอร์ เฟรนช์ฟรายส์ และโซฟาตัวโปรด พลังแห่งการไม่อาบน้ำ 7 วัน",
    image: "images/4.jpeg"
  },
  {
    id: 5,
    name: "แองกรี้สลีปเปอร์ เรด",
    sub: "Angry Sleeper Red",
    category: "Fighter",
    categoryName: "สายเบอร์เซิร์ก",
    cost: 3,
    atk: 4,
    def: 4,
    skill: {
      id: "slingshot_burst",
      name: "นกง่วงพุ่งชน",
      desc: "พุ่งชนทำดาเมจ 3 หน่วยใส่ศัตรู (ตัวเองรับแรงสะท้อน 1 ดาเมจ)",
      type: "recoil_attack",
      extraDmg: 3,
      selfDmg: 1
    },
    quote: "อย่ามาปลุกตอนกำลังเคลิ้ม เดี๋ยวพุ่งชนไส้แตก!",
    image: "images/5.jpeg"
  },
  {
    id: 6,
    name: "บุรุษเหล็กกางเกงบ็อกเซอร์",
    sub: "Boxer Sky Diver",
    category: "Assassin",
    categoryName: "สายเหินเวหา",
    cost: 3,
    atk: 4,
    def: 3,
    skill: {
      id: "freefall_strike",
      name: "ร่อนพริ้วไร้เสื้อ",
      desc: "โจมตี 2 ดาเมจ และได้รับเกราะลอยตัว +3 หน่วย",
      type: "evade_strike",
      dmgVal: 2,
      shieldVal: 3
    },
    quote: "สูดลมหายใจบนความสูงสามหมื่นฟุต แบบโนสนโนแคร์",
    image: "images/6.jpeg"
  },
  {
    id: 7,
    name: "ตื่นแล้วโว้ย!",
    sub: "Eyes Wide Open",
    category: "Assassin",
    categoryName: "สายตาสว่าง",
    cost: 2,
    atk: 3,
    def: 3,
    skill: {
      id: "stare_discard",
      name: "จ้องหน้าจนตาสว่าง",
      desc: "ศัตรูตกใจ สุ่มทิ้งการ์ดบนมือ 1 ใบ และทำดาเมจ 1 หน่วย",
      type: "discard_enemy",
      dmgVal: 1
    },
    quote: "มองตาฉันสิ... เห็นอนาคตไหมว่าเทิร์นนี้แกไม่รอด!",
    image: "images/7.jpeg"
  },
  {
    id: 8,
    name: "เดลิเวอรี่กล่องพิซซ่า",
    sub: "Pizza Box Delivery",
    category: "Tank",
    categoryName: "สายฮา/ป้องกัน",
    cost: 3,
    atk: 2,
    def: 6,
    skill: {
      id: "pizza_shield",
      name: "กล่องปิดบังจุดยุทธศาสตร์",
      desc: "สร้างเกราะป้องกัน +4 หน่วย และกินชีสฟื้นฟู HP +2",
      type: "super_shield",
      shieldVal: 4,
      healVal: 2
    },
    quote: "พิซซ่าถาดใหญ่ ส่งร้อนๆ ถึงหน้าบ้าน... กรุณาอย่าเปิดกล่องดู!",
    image: "images/1792547722853.jpg"
  },
  {
    id: 9,
    name: "เบนเท็น สี่แขนร่างสอง",
    sub: "Fourarms Quad-Slap",
    category: "Fighter",
    categoryName: "สายคอมโบหมัดหนัก",
    cost: 5,
    atk: 5,
    def: 5,
    skill: {
      id: "quad_slap",
      name: "ตบสี่ทิศแปดด้าน",
      desc: "ทลายเกราะศัตรูสูงสุด 4 หน่วย และรัวหมัดทำดาเมจ 4 หน่วย",
      type: "break_guard",
      shieldBreak: 4,
      dmgVal: 4
    },
    quote: "มีแขน 4 ข้าง จะให้ต่อยมวยทีละหมัดทำไมล่ะเหวย!",
    image: "images/Gemini_Generated_Image_980u6n980u6n980u.jpeg"
  },
  {
    id: 10,
    name: "เชร็คหน้าเขียวปลักโคลน",
    sub: "Swamp Ogre Shrek",
    category: "Chaos",
    categoryName: "สายพิษ/ปั่นป่วน",
    cost: 4,
    atk: 4,
    def: 5,
    skill: {
      id: "swamp_poison",
      name: "แก๊สบึงมรณะ",
      desc: "สร้างความเสียหาย 2 หน่วย และทำให้ศัตรูติดพิษสะสม 2 หน่วย",
      type: "poison_drain",
      dmgVal: 2,
      poisonVal: 2
    },
    quote: "นี่คือบึงของข้า! กลิ่นตัวข้าจะชโลมจิตวิญญาณเจ้าเอง",
    image: "images/Gemini_Generated_Image_9bccp39bccp39bcc.jpeg"
  },
  {
    id: 11,
    name: "หนอนลาวาคู่หูดูโอ้",
    sub: "Larva Double Trouble",
    category: "Chaos",
    categoryName: "สายป่วนคู่หู",
    cost: 2,
    atk: 2,
    def: 3,
    skill: {
      id: "larva_fart",
      name: "ตดยิงจรวดสลับการ์ด",
      desc: "ขโมย Energy ฝ่ายตรงข้าม 1 หน่วยมาเป็นของเรา และจั่วการ์ด 1 ใบ",
      type: "steal_energy",
      drawCount: 1
    },
    quote: "เหลืองกับแดง แสบคูณสอง น้ำมูกยืดสู้ศึก!",
    image: "images/Gemini_Generated_Image_kwy6itkwy6itkwy6.jpeg"
  },
  {
    id: 12,
    name: "หมวกแก๊ปเตียงดูดวิญญาณ",
    sub: "Mattress Comatose",
    category: "Support",
    categoryName: "สายสะกดหลับ",
    cost: 3,
    atk: 2,
    def: 5,
    skill: {
      id: "bed_sleep",
      name: "เตียงนุ่มดูดพลัง",
      desc: "ทำให้ศัตรูง่วงนอน ลดพลังโจมตี -2 ในเทิร์นถัดไป และฟื้นฟู HP 3",
      type: "weaken_heal",
      weakenVal: 2,
      healVal: 3
    },
    quote: "เตียงนุ่ม แอร์ 22 องศา โทรศัพท์ชาร์จแบตเต็ม ใครจะลุกก็บ้าแล้ว",
    image: "images/Gemini_Generated_Image_njs9nynjs9nynjs9.jpg"
  },
  {
    id: 13,
    name: "เนคไทเสื้อขาดซิกแพก",
    sub: "Ripped Shirt Scholar",
    category: "Fighter",
    categoryName: "สายบ้าระห่ำ",
    cost: 4,
    atk: 5,
    def: 4,
    skill: {
      id: "shirt_rip",
      name: "ฉีกเสื้อท้าดวล",
      desc: "สละเกราะตัวเองเพื่อทำดาเมจ 3 หน่วย (+เกราะที่สละ สูงสุดไม่เกิน 6 ดาเมจ)",
      type: "berserk_buff",
      boostAtk: 3,
      maxDmg: 6
    },
    quote: "เรียนหนักจนเสื้อขาด หรือพลังกล้ามมันระเบิดออกมากันแน่!",
    image: "images/Gemini_Generated_Image_nkpk4ynkpk4ynkpk.jpeg"
  },
  {
    id: 14,
    name: "คาเนกิ ตาแดงคลั่งรัก",
    sub: "Tokyo Ghoul Kaneki Eye",
    category: "Assassin",
    categoryName: "สายดูดเลือด",
    cost: 4,
    atk: 4,
    def: 4,
    skill: {
      id: "ghoul_drain",
      name: "คากุเนะสูบพลังชีวิต",
      desc: "โจมตีทำดาเมจ 3 หน่วย และดูดเลือดกลับมาฟื้นฟู HP ตัวเอง +3",
      type: "lifesteal",
      dmgVal: 3
    },
    quote: "1,000 ลบ 7 ได้เท่าไหร่?... ผมถามว่ามื้อนี้ใครจะจ่าย!",
    image: "images/Gemini_Generated_Image_ovar5lovar5lovar.jpeg"
  },
  {
    id: 15,
    name: "นกเหลืองสปีดโบ๊ท ชัค",
    sub: "Angry Sleeper Chuck",
    category: "Assassin",
    categoryName: "สายความเร็วแสง",
    cost: 3,
    atk: 3,
    def: 3,
    skill: {
      id: "sonic_dash",
      name: "แดชทะลุมิติสายฟ้าแลบ",
      desc: "โจมตีฉับพลัน 2 ดาเมจ และจั่วการ์ดทันที 1 ใบ",
      type: "quick_draw",
      dmgVal: 2,
      drawCount: 1
    },
    quote: "หลับแต่ไว เร็วกว่าเสียง บินโฉบหัวเพื่อนได้ใน 0.1 วินาที",
    image: "images/Gemini_Generated_Image_r2mua9r2mua9r2mu.jpg"
  },
  {
    id: 16,
    name: "เสี่ยเบิ้มโป้งเดียวรู้เรื่อง",
    sub: "Big Boss Thumbs Up",
    category: "Support",
    categoryName: "สายเสี่ยเปย์",
    cost: 2,
    atk: 2,
    def: 4,
    skill: {
      id: "boss_thumbsup",
      name: "ยอดเยี่ยมมากไอ้น้อง",
      desc: "มอบ Energy พิเศษ +1 หน่วยในเทิร์นนี้ และเพิ่มเกราะ +2",
      type: "grant_energy",
      energyVal: 1,
      shieldVal: 2
    },
    quote: "กดไลก์ให้หนึ่งที งานนี้เสี่ยเลี้ยงเอง เต็มที่ไปเลยวัยรุ่น!",
    image: "images/Gemini_Generated_Image_t2e45ct2e45ct2e4.jpeg"
  },
  {
    id: 17,
    name: "บอมบ์หัวจุดชนวน",
    sub: "Angry Sleeper Bomb",
    category: "Chaos",
    categoryName: "สายระเบิดล้างบาง",
    cost: 5,
    atk: 6,
    def: 3,
    skill: {
      id: "nuke_slumber",
      name: "นิวเคลียร์หลับปุ๋ย",
      desc: "ระเบิดทำดาเมจ 4 หน่วยใส่ฮีโร่ศัตรู และกวาดดาเมจ 2 ใส่มินเนียนศัตรูทุกตัว!",
      type: "nuke_strike",
      dmgVal: 4,
      aoeDmg: 2
    },
    quote: "อย่าให้ฟิวส์บนหัวติดไฟ เพราะถ้าตื่นมาคือกระดานพัง!",
    image: "images/Gemini_Generated_Image_w62h0zw62h0zw62h.jpg"
  },
  {
    id: 18,
    name: "อาจารย์ชี้ชะตา",
    sub: "Finger of Destiny",
    category: "Support",
    categoryName: "สายสั่งการ/ใบ้",
    cost: 3,
    atk: 3,
    def: 4,
    skill: {
      id: "destiny_callout",
      name: "คุณนั่นแหละ... ออกมาตอบ!",
      desc: "ทำดาเมจ 2 หน่วย และ 'ใบ้' สกิลพิเศษของศัตรูในเทิร์นถัดไป",
      type: "silence_skill",
      dmgVal: 2
    },
    quote: "ไม่ต้องก้มหน้า มองตาอาจารย์... ออกมาทำโจทย์หน้าห้องเดี๋ยวนี้!",
    image: "images/IMG_20260921_130220.jpg"
  },
  {
    id: 19,
    name: "เทพบุตรบลูสกรีน",
    sub: "The Pure Blue Boy",
    category: "Support",
    categoryName: "สายบริสุทธิ์คลีนซิ่ง",
    cost: 2,
    atk: 2,
    def: 4,
    skill: {
      id: "cleanse_heal",
      name: "ล้างสถานะผิดปกติ",
      desc: "ลบล้างดีบัฟและพิษทั้งหมด และฟื้นฟู HP 4 หน่วยทันที",
      type: "cleanse_heal",
      healVal: 4
    },
    quote: "หน้าใส ไร้สิ่งเจือปน แบ็กกราวด์สีฟ้าพร้อมติดบัตรประชาชน",
    image: "images/IMG_20261021_085203.jpg"
  },
  {
    id: 20,
    name: "เก็กโกะ แฟลชสตันเนอร์",
    sub: "Gekko Flash Ace",
    category: "Assassin",
    categoryName: "สายดูเอลลิสต์",
    cost: 4,
    atk: 4,
    def: 4,
    skill: {
      id: "dizzy_blind",
      name: "ปล่อยน้องดิซซี่พ่นหมึก",
      desc: "ทำดาเมจ 3 หน่วย และทำให้ศัตรูตาบอด การโจมตีถัดไปทำดาเมจได้แค่ 1",
      type: "blind_enemy",
      dmgVal: 3
    },
    quote: "แฟลชเปิดไซต์ สไปก์พร้อมวาง แชมป์ทัวร์นาเมนต์แห่งห้องเรียน",
    image: "images/ed9e7aa4-dc13-498d-971e-040f8962f4d0.jpeg"
  },
  {
    id: 21,
    name: "ราชินีบิกินี่แดงสะท้านโลกันตร์",
    sub: "Red Bikini Siren",
    category: "Chaos",
    categoryName: "สายเสน่ห์ยั่วยวน",
    cost: 5,
    atk: 5,
    def: 5,
    skill: {
      id: "visual_hazard",
      name: "ดาเมจสายตา 9999",
      desc: "ทำดาเมจ 3 หน่วย และสุ่มขโมยการ์ดจากมือศัตรูมาเป็นของเรา 1 ใบ!",
      type: "steal_hand_card",
      dmgVal: 3
    },
    quote: "ดาเมจต่อพลังชีวิตยังพอทน แต่ดาเมจต่อสายตา... เกินต้านทาน!",
    image: "images/qwen_edit_20261004_234512.png"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CARDS_DATA };
}
