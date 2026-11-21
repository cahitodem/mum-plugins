# Windows Nuvio oynatma tanılaması

Hedef, aynı içerikte tek değişken değiştirerek kaynak hatasını decoder/renderer sorunundan ayırmaktır. Henüz belirli bir codec veya ekran kartı suçlanmış değildir.

1. Nuvio sürümünü, Windows sürümünü, GPU/sürücü sürümünü ve oynatıcı seçimini kaydedin. Yalnız MUM'daki tek sağlayıcı açık olsun. Film TMDB kimliği veya dizi kimliği + sezon/bölüm aynı kalsın.
2. Önce `[MUM] started` ve son durum kaydını kontrol edin. Hiç başlamıyorsa eklenti yükleme/UI aşaması; `empty` ise eşleştirme/ağ/ayrıştırma; `invalid-results` ise scraper'ın döndürdüğü adres incelenir. `about:error` tek başına codec kanıtı değildir.
3. Kaynak varsa videoyu açın; görüntü ve sesi ayrı ayrı kaydedin. 30–60 saniye izleyin ve ileri sarın. HTTP 200 veya HLS master dosyası yalnız ağ erişimini gösterir.
4. Aynı sağlayıcı ve içerikte H.264/AVC + AAC, SDR, 720p/1080p kaynağı HEVC/AV1, 10-bit veya HDR kaynağıyla karşılaştırın. Codec bilgisi oynatıcı istatistiğinden alınmalı; dosya adı/kalite etiketi yeterli değildir. Yalnız HDR başarısızsa HDR/ton eşleme ve bit derinliğini; yalnız HEVC/AV1 başarısızsa decoder yolunu araştırın.
5. Aynı kaynak üzerinde donanımsal çözmeyi açık/kapalı karşılaştırın; uygulama sürümünde bu seçenek varsa kullanın. Yazılım çözmede görüntü gelmesi donanım decoder/sürücü yoluna işaret eder, kesin kanıt değildir. Diğer ayarlar sabit kalsın.
6. Aynı kaynak için Nuvio'nun desteklediği renderer seçeneklerini ayrı ayrı deneyin. Görüntü yalnız bir renderer ile geliyorsa yüzey/sunum yoluna odaklanın. Nuvio arayüz renderer'ı ile video renderer'ı aynı ayar olmayabilir. Başarılı görüntü elde edilmeden kalıcı ayar değişikliği yapmayın.
7. Aynı geçerli kaynak, aynı gerekli Referer/User-Agent bilgileriyle Nuvio'nun harici oynatıcı aktarımı üzerinden açılabiliyorsa karşılaştırın. Bağlantı süresi dolmuş veya başlıklar eksikse sonuç decoder karşılaştırması sayılmaz. Yeni kurulum zorunlu değildir. Harici mpv mevcutsa `i` istatistiği ve Ctrl+h donanımsal çözme karşılaştırmasını kullanabilirsiniz.
8. Aynı içerik başka sağlayıcıda düzgünse kaynak kodlaması/HLS varyantı/başlık farkını inceleyin. Her kaynakta siyah ekran varsa uygulama/GPU/renderer ihtimali güçlenir. Bir örnekle genelleme yapmayın.

Nuvio'da olmayan menülerin varlığı varsayılmamalıdır. Test sonunda değiştirdiğiniz ayarları eski değerine döndürün. Yönetici yetkisi, TLS doğrulamasını kapatma, DRM/CAPTCHA aşma veya güvenlik yazılımını kapatma bu tanılama için gerekli değildir.

Referans: [mpv kullanım belgesi](https://mpv.io/manual/stable/) (istatistik, donanımsal çözme ve video çıkışı). Bu repo Nuvio'nun oynatıcı/decoder kodunu değiştirmez.
