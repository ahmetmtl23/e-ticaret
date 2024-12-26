const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas bağlantısı
const kul_adi = "ahmetdb";
const sifre = "ahmetdb";
const adres = "cluster0.jvwfk.mongodb.net";

// MongoDB Atlas bağlantı URL'i
const mongoURI = `mongodb+srv://${kul_adi}:${sifre}@${adres}/kullanicilar?retryWrites=true&w=majority`;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB bağlantısı başarılı!'))
    .catch(err => console.error('MongoDB bağlantısı hatası:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Multer ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Ürün modeli
const urunSchema = new mongoose.Schema({
    urun_adi: { type: String, required: true },
    fiyat: { type: Number, required: true },
    stok: { type: Number, required: true },
    aciklama: { type: String, required: true },
    resim: { type: String, required: true }
}, { collection: 'urunler' }); // Koleksiyon adını burada belirtiyoruz

const Urun = mongoose.model('Urun', urunSchema);

// Sayaç modeli
const counterSchema = new mongoose.Schema({
    sequenceValue: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Ürünleri Listeleme (Read)
app.get('/api/urunler', async (req, res) => {
    try {
        const urunler = await Urun.find();
        res.status(200).json(urunler);
    } catch (err) {
        res.status(500).json({ message: 'Ürünleri listeleme hatası', error: err });
    }
});

// Ürün Ekleme (Create)
app.post('/api/urunler', upload.single('resim'), async (req, res) => {
    const { urun_adi, fiyat, stok, aciklama } = req.body;
    const image = `/uploads/${path.basename(req.file.path)}`; // Resim dosyasının yolu

    // Yeni ürün oluştur
    const yeniUrun = new Urun({ 
        urun_adi, 
        fiyat, 
        stok, 
        aciklama, 
        resim: image 
    });

    try {
        await yeniUrun.save(); // Ürünü veritabanına kaydet
        res.status(201).json({ message: 'Ürün başarıyla eklendi!', urun: yeniUrun });
    } catch (err) {
        res.status(400).json({ message: 'Ürün ekleme hatası', error: err });
    }
});

// API endpoint: Ürün güncelle
app.put('/api/urunler/:id', upload.single('resim'), async (req, res) => {
    const productId = req.params.id;
    const { urun_adi, fiyat, stok, aciklama } = req.body;

    let resim; // Ürün resminin yeni yolunu tutacak değişken

    try {
        // Ürün bilgilerini al
        const product = await Urun.findById(productId);

        if (!product) {
            return res.status(404).send('Ürün bulunamadı.');
        }

        // Eğer yeni bir resim yüklenmişse, yeni resmi kullan
        if (req.file) {
            resim = `/uploads/${path.basename(req.file.path)}`; // Yüklenen resmin yolu
        } else {
            // Yeni resim yüklenmediyse mevcut resmi kullan
            resim = product.resim;
        }

        // Ürün güncelleme
        const updateDoc = {
            urun_adi,
            fiyat,
            stok,
            aciklama,
            resim
        };

        const updatedProduct = await Urun.findByIdAndUpdate(productId, updateDoc, { new: true });

        if (!updatedProduct) {
            return res.status(404).send('Ürün bulunamadı veya hiçbir değişiklik yapılmadı.');
        }

        res.status(200).send('Ürün başarıyla güncellendi.');
    } catch (error) {
        console.error('MongoDB bağlantısında bir hata oluştu:', error);
        res.status(500).send('Bir hata oluştu.');
    }
});

// Ürün Silme (Delete)
app.delete('/api/urunler/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const urun = await Urun.findByIdAndDelete(id);
        if (!urun) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        res.status(200).json({ message: 'Ürün silindi!' });
    } catch (err) {
        res.status(500).json({ message: 'Ürün silme hatası', error: err });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
