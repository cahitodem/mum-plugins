# MUM Plugins

Kişisel MUM projesi için Anthology v1.8.39 tabanlı Nuvio Desktop film/dizi eklenti deposu. Güncel geliştirme sürümü: **0.1.2**. Windows hedeflenir; Android TV testi yapılmamıştır.

Kaynak bulunması, HTTP 200 alınması veya bir HLS parçasının indirilmesi **oynatma doğrulaması değildir**. Son canlı kontrollerde DiziYou (Breaking Bad S5E16) ve FilmModu (Game of Thrones S1E1) birer kaynak döndürdü; Windows Nuvio oynatması doğrulanmadı.

## Kurulum

Bu dal GitHub'a gönderildikten sonra Nuvio'nun **Pluginler → Depo Ekle** alanına:

```text
https://raw.githubusercontent.com/cahitodem/mum-plugins/mum/bootstrap/manifest.json
```

Bu bir Nuvio scraper manifestidir, Stremio addon manifesti değildir. `filename` alanları manifestin bulunduğu dizine göre çözülür. Eski Anthology ile çakışmamak için kimlikler `mum_` öneki taşır. Karşılaştırma sırasında Anthology kopyalarını kapatıp tek sağlayıcı etkinleştirin. Dal main'e birleştirilirse URL'deki `mum/bootstrap` yerine `main` kullanın. Güncel manifest görünmüyorsa depo yenilemesini kullanın; otomatik yenileme anlık olmayabilir.

## Geliştirme

Node.js 20 ve npm:

```powershell
npm ci
npm run build
npm test
```

`sources.json`: açık sağlayıcı listesi, türler, sürüm ve kullanıcının eski gözlemleri. `config.json`: yalnız seçili sağlayıcıların adres ayarları. Bu ayarlar pakete gömülür; değişiklikten sonra yeniden derleyin. Çalışma anında Anthology'nin uzaktaki config.json dosyası indirilmez.

`src/<sağlayıcı>/index.js`: upstream ayrıştırıcılar. `src/shared/adapter.js`: Nuvio çağrı sınırı, tür ve bölüm denetimi, URL doğrulama, başlık aktarımı, zaman aşımı ve güvenli durum raporları. `providers/mum_*.js` ve `manifest.json`: derlenmiş kurulum çıktıları; bunları elle düzenlemeyin.

İsteğe bağlı **gerçek ağ** sorgusu, tek sağlayıcı başına ayrı süreçte:

```powershell
npm run test:provider -- diziyou 1396 tv 1 1
npm run test:provider -- filmmodu 550 movie
```

Bu komutlar videoyu oynatmaz. Çıkış kodu 0, sorgunun tamamlandığını belirtir; kaynak/başarı için JSON `status` alanına bakın. Genel CI testleri ağa çıkmaz. Paketler Node VM içinde sınırlı host modülleriyle yüklenir; bu test gerçek Nuvio/QuickJS ve oynatıcı testi yerine geçmez. DiziYou için sentetik HTML ile arama → bölüm → HLS sonucu da sınanır.

## Gözlemler

Aşağıdaki bilgiler kullanıcının **Windows Nuvio + Anthology 1.8.39** testlerinden gelir; MUM test sonucu değildir. İçerik kimlikleri ve Nuvio sürümü henüz kaydedilmemiştir.

| Sağlayıcı | Kaynak araması | Oynatma |
|---|---|---|
| Anthology M3U, DDiziBox, HDFilmDelisi, HDFilmIzle, SetFilmIzle, SezonlukDizi, Vidlink, Vidmody, Webteizle | Kaynak dönmüş | Doğrulanmadı |
| SinemaCX, SineWix, DiziMom, YabancıDizi, DiziBoxİzle | Yeni eklendi; canlı sorgu yapılmadı | Doğrulanmadı |
| DiziYou | Güncel `.love` akışıyla kaynak bulundu | Oynatma doğrulanmadı |
| FilmModu | GOT S1E1 kaynak bulundu; TV desteği eklendi | Oynatma doğrulanmadı |
| HDFilmCehennemi | Kullanıcı testinde boş | Doğrulanmadı |

Anthology M3U'nun yalnız film/dizi listeleri tutulur; canlı M3U sağlayıcısı ayrıydı ve kaldırıldı. Genel film/dizi siteleri animasyon da içerebilir; film/TV olarak etiketlenmiş her içeriğin türünü bu scraper arayüzüyle kesin filtrelemek mümkün değildir. Animeye özel sağlayıcılar ve anime türü çağrıları kapsam dışıdır.

## Raporlar ve sınırlar

MUM yalnız `provider`, `status`, `count`, `rejected`, `elapsedMs`, `playback` alanlarını yazar. Durumlar: `started`, `sources-found`, `empty`, `invalid-results`, `unsupported-type`, `invalid-input`, `timeout`, `error`. Ham hata metni, URL, çerez ve Authorization yazılmaz; upstream sağlayıcı konsol çıktıları derlenmiş modülde susturulur. Nuvio'nun kendi ağ günlükleri bu katmanın kontrolünde değildir.

Adapter bir sağlayıcıyı varsayılan 12 saniyede, FilmModu gibi çok adımlı kaynağı 15 saniyede bekler; Promise zaman aşımı Nuvio'ya sonucu döndürür ancak upstream fetch'lerini iptal etmeyebilir. Yerel probe 55 saniyede süreci sonlandırır. Upstream'in kendi içinde yakalayıp `[]` döndürdüğü hatalar `empty` olarak kalır. Bir `started` kaydı yoksa UI/manifest/yükleme aşamasını kontrol edin.

Siyah ekran ve ses incelemesi: [Windows tanılama](docs/WINDOWS-DIAGNOSTICS.md). Teknik kanıtlar ve sonraki işler: [inceleme](docs/REVIEW.md). Hata kaydı: [şablon](docs/BUG-REPORT.md).

## Fork ve devam

Fork: https://github.com/cahitodem/mum-plugins ; upstream: https://github.com/falsisdev/anthology . Geliştirme dalı `mum/bootstrap`.

```powershell
git clone --branch mum/bootstrap https://github.com/cahitodem/mum-plugins.git
cd mum-plugins
git remote add upstream https://github.com/falsisdev/anthology.git
```

Upstream ana dalında Windows'ta geçersiz `tv:...json` dosya adları vardır. Yeni MUM dalında canlı kataloglar kaldırılmıştır. Upstream güncellemelerini doğrudan birleştirmek yerine sağlayıcı değişikliklerini inceleyerek taşıyın; aksi halde kapsam dışı içerik geri gelebilir.

## Lisans ve atıf

Ana [LICENSE](LICENSE) dosyası değiştirilmeden korunmuştur: GNU GPL v3. Upstream paket meta verisindeki MIT alanı ana lisansla uyumlu `GPL-3.0-only` olarak düzeltildi. Orijinal sağlayıcı atıfları kaynak dosyalarda korunur. Değişiklik kaydı ve dağıtım notları: [NOTICE.md](NOTICE.md). Bu proje Nuvio veya Anthology'nin resmî ürünü değildir.
