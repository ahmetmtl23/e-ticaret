document.getElementById('urunForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Form verilerini al
    const formData = new FormData(e.target);
    
    // Form verilerini kontrol et
    if (!formData.get('urun_adi') || !formData.get('fiyat') || !formData.get('stok') || !formData.get('aciklama') || !formData.get('resim')) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    const response = await fetch('/api/urunler', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        alert('Ürün eklendi!');
        resetForm();
        loadUrunler();
    } else {
        const error = await response.json();
        alert('Ürün eklenirken hata oluştu: ' + error.message);
    }
});

async function loadUrunler() {
    const response = await fetch('/api/urunler');
    const urunler = await response.json();
    const urunlerListesi = document.getElementById('urunler');
    urunlerListesi.innerHTML = '';
    urunler.forEach(urun => {
        const div = document.createElement('div');
        div.innerHTML = `<img src="${urun.resim}" alt="${urun.urun_adi}" style="width: 80px; height: auto; margin-right: 15px;" />`;
        div.innerHTML += `<div class='urun-bilgi'><h3>${urun.urun_adi}</h3><p>Fiyat: ${urun.fiyat} TL</p><p>Stok: ${urun.stok}</p><p>Açıklama: ${urun.aciklama}</p></div>`;
        div.innerHTML += `<button onclick='deleteUrun("${urun._id}")'>Sil</button>`;
        div.innerHTML += `<button onclick='showUpdateForm("${urun._id}", "${urun.urun_adi}", ${urun.fiyat}, ${urun.stok}, "${urun.aciklama}")'>Güncelle</button>`;
        urunlerListesi.appendChild(div);
    });
}

async function deleteUrun(id) {
    const response = await fetch(`/api/urunler/${id}`, {
        method: 'DELETE'
    });
    if (response.ok) {
        alert('Ürün silindi!');
        loadUrunler();
    } else {
        alert('Silme işlemi sırasında hata oluştu.');
    }
}

function resetForm() {
    const form = document.getElementById('urunForm');
    form.reset();
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = await fetch('/api/urunler', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('Ürün eklendi!');
            resetForm();
            loadUrunler();
        } else {
            alert('Ekleme işlemi sırasında hata oluştu.');
        }
    };
}

function showUpdateForm(id, urun_adi, fiyat, stok, aciklama) {
    const form = document.getElementById('guncellemeForm');
    form.urun_adi.value = urun_adi;
    form.fiyat.value = fiyat;
    form.stok.value = stok;
    form.aciklama.value = aciklama;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const response = await fetch(`/api/urunler/${id}`, {
            method: 'PUT',
            body: formData
        });
        if (response.ok) {
            alert('Ürün güncellendi!');
            loadUrunler();
            cancelUpdate();
        } else {
            alert('Güncelleme işlemi sırasında hata oluştu.');
        }
    };
    document.getElementById('guncellemePaneli').style.display = 'block';
}



async function updateProduct() {
    const id = document.getElementById('urunId').value; // ID'yi buradan alıyoruz
    const formData = new FormData();
    formData.append('urun_adi', document.getElementById('urunAdi').value);
    formData.append('fiyat', document.getElementById('fiyat').value);
    formData.append('stok', document.getElementById('stok').value);
    formData.append('aciklama', document.getElementById('aciklama').value);
    formData.append('resim', document.getElementById('resimInput').files[0]);

    const response = await fetch(`/api/urunler/${id}`, {
        method: 'PUT',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Hata:', error);
        alert('Güncelleme işlemi sırasında hata oluştu: ' + error.message);
    } else {
        const data = await response.json();
        alert('Ürün güncellendi!');
    }
}

loadUrunler();
