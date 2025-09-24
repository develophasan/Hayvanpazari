#!/bin/bash

# Ahmet (Satıcı) token al
AHMET_TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ahmet@satici.com", "password": "123456"}' | jq -r '.access_token')

echo "Creating demo listings with token: $AHMET_TOKEN"

# 1. Holstein İnek
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Üretken Holstein İnek - 4 Yaşında",
    "description": "Günlük 32 litre süt veren sağlıklı Holstein inek. Tüm aşıları tam, veteriner kontrolü yapılmış. Gebeliği 6 aylık.",
    "category": "cattle",
    "price": 35000,
    "price_type": "negotiable",
    "location": {"city": "Konya", "district": "Meram"},
    "animal_details": {
      "breed": "Holstein",
      "age_months": 48,
      "weight_kg": 650,
      "gender": "female",
      "purpose": "dairy",
      "milk_yield": 32,
      "pregnancy_status": "pregnant",
      "ear_tag": "TR001234567"
    },
    "images": []
  }' && echo "Holstein İnek oluşturuldu"

# 2. Simmental Boğa
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Üreme Amaçlı Simmental Boğa - 3 Yaşında", 
    "description": "Güçlü yapılı, sağlıklı Simmental boğa. Üreme amaçlı kullanılabilir. Pedigri belgeli, tüm sağlık kontrolları yapılmış.",
    "category": "cattle",
    "price": 85000,
    "price_type": "fixed",
    "location": {"city": "Ankara", "district": "Polatlı"},
    "animal_details": {
      "breed": "Simmental",
      "age_months": 36,
      "weight_kg": 800,
      "gender": "male",
      "purpose": "breeding",
      "ear_tag": "TR001234568"
    },
    "images": []
  }' && echo "Simmental Boğa oluşturuldu"

# 3. Merinos Koyun Sürüsü
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Kaliteli Merinos Koyun Sürüsü - 15 Baş",
    "description": "15 baş Merinos koyun sürüsü. 10 dişi, 5 erkek. Yem ve otlaklık dahil. Sağlıklı ve üretken sürü.",
    "category": "sheep",
    "price": 45000,
    "price_type": "negotiable",
    "location": {"city": "Afyon", "district": "Merkez"},
    "animal_details": {
      "breed": "Merinos",
      "age_months": 24,
      "weight_kg": 60,
      "gender": "mixed",
      "purpose": "dairy",
      "ear_tag": "TR001234569"
    },
    "images": []
  }' && echo "Merinos Koyun Sürüsü oluşturuldu"

# 4. Saanen Keçi
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Yüksek Verimli Saanen Keçi - Süt Üretimi",
    "description": "Günlük 4-5 litre süt veren kaliteli Saanen keçi. 2 yaşında, sağlıklı ve bakımlı. İlk doğum yapmış.",
    "category": "goat",
    "price": 8500,
    "price_type": "fixed", 
    "location": {"city": "İzmir", "district": "Ödemiş"},
    "animal_details": {
      "breed": "Saanen",
      "age_months": 24,
      "weight_kg": 65,
      "gender": "female",
      "purpose": "dairy",
      "milk_yield": 4.5,
      "ear_tag": "TR001234570"
    },
    "images": []
  }' && echo "Saanen Keçi oluşturuldu"

# 5. Yumurtacı Tavuk Sürüsü
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Yumurtacı Tavuk Sürüsü - 50 Adet",
    "description": "50 adet yumurtacı tavuk. Günlük ortalama 40-45 yumurta. Sağlıklı ve üretken. Kümes dahil edilebilir.",
    "category": "poultry",
    "price": 12500,
    "price_type": "negotiable",
    "location": {"city": "Bursa", "district": "İnegöl"},
    "animal_details": {
      "breed": "Yumurtacı",
      "age_months": 12,
      "weight_kg": 2,
      "gender": "mixed",
      "purpose": "egg_production",
      "ear_tag": "TR001234571"
    },
    "images": []
  }' && echo "Yumurtacı Tavuk Sürüsü oluşturuldu"

# 6. Arap Atı
curl -s -X POST http://localhost:8001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AHMET_TOKEN" \
  -d '{
    "title": "Binicilik için Arap Atı - Eğitimli",
    "description": "5 yaşında eğitimli Arap atı. Binicilik için uygun, sakin karakterli. Veteriner kontrolü yapılmış, çok bakımlı.",
    "category": "horse",
    "price": 120000,
    "price_type": "negotiable",
    "location": {"city": "İstanbul", "district": "Şile"},
    "animal_details": {
      "breed": "Arap Atı",
      "age_months": 60,
      "weight_kg": 450,
      "gender": "male",
      "purpose": "sport",
      "ear_tag": "TR001234572"
    },
    "images": []
  }' && echo "Arap Atı oluşturuldu"

echo "Tüm demo ilanlar oluşturuldu!"

# İlanları listele
curl -s http://localhost:8001/api/listings | jq '.[] | {title: .title, price: .price}'