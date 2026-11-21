# İnceleme ve geliştirme sınırı — 21 Kasım 2026

Anthology `7cefd7a0605921144e0d3819adec1d41b283491a` (1.8.39) incelendi. `src/` sağlayıcı girişleri ve ortak yardımcılar, `providers/` CommonJS çıktıları, `build.js` esbuild paketlemesi, `manifest.json` Nuvio deposu, `config.json` adres/ayar kaynağıydı. Ayrıca WebDAV sunucusu ve Stremio canlı katalogları bulunuyordu.

Upstream build: `node build.js && node scripts/build_stremio_catalogs.js`. Varsayılan test Stremio doğrulaması ve canlı katalog testlerini çalıştırıyordu. Ayrı sağlayıcı/playability betikleri gerçek ağa çıkıyor, HTTP yanıtlarını playable olarak etiketleyebiliyordu. `test_all_providers.js` TLS doğrulamasını kapatıyordu; bu davranış MUM'a taşınmadı. Build bazı sağlayıcı hatalarını sayıp sıfır çıkış koduyla bitebiliyordu; MUM hata halinde başarısız olur. Eski CI ve zamanlanmış canlı kaynak güncellemeleri kaldırıldı.

## Nuvio Desktop sözleşmesi

İncelenen kaynak: NuvioMedia/NuvioDesktop `5deefed55d90108fd8e6c9f8786a4d9d5c5e6613`. Bu, kullanıcının kurulu sürümünün aynı commit olduğu anlamına gelmez.

- [PluginModels.kt](https://github.com/NuvioMedia/NuvioDesktop/blob/5deefed55d90108fd8e6c9f8786a4d9d5c5e6613/composeApp/src/commonMain/kotlin/com/nuvio/app/features/plugins/PluginModels.kt): manifest `name`, `version`, `scrapers`; her scraper `id`, `name`, `version`, `filename`, `supportedTypes`, `enabled`.
- [JsBindings.kt](https://github.com/NuvioMedia/NuvioDesktop/blob/5deefed55d90108fd8e6c9f8786a4d9d5c5e6613/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/js/JsBindings.kt): `module.exports.getStreams || globalThis.getStreams`, ardından `getStreams(tmdbId, mediaType, season, episode)`. Promise sonucu JSON dizi olarak alınır. Fetch, timer, AbortController, URL ve Cheerio köprüleri vardır. `require` yalnız Cheerio varyantları ve crypto-js sunar; Node fs/path/axios varsayılmamalıdır.
- [PluginRuntime.kt](https://github.com/NuvioMedia/NuvioDesktop/blob/5deefed55d90108fd8e6c9f8786a4d9d5c5e6613/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/PluginRuntime.kt): CommonJS sarmalama, 60 saniyelik çağrı sınırı ve 10 eşzamanlı eklenti sınırı. Sonuç parser'ı `url`, üst düzey `headers`, başlık/kalite ve altyazı alanlarını okur; yalnız `behaviorHints.proxyHeaders` yeterli değildir. MUM bunu `headers` alanına taşır.
- [PluginRepository.kt](https://github.com/NuvioMedia/NuvioDesktop/blob/5deefed55d90108fd8e6c9f8786a4d9d5c5e6613/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/PluginRepository.kt): göreli filename manifestin temel URL'siyle birleştirilir.

Bu doğrulama kod incelemesine dayanır. Yerel testlerde Node VM kullanıldı; JVM QuickJS motoru veya kurulu Nuvio açılarak test edilmedi. Cheerio köprüsü npm Cheerio'nun tüm davranışlarını desteklemeyebilir.

## Sonraki sağlayıcı işleri

1. Kullanıcının kurulu Nuvio sürümü ve her başarısız örneğin içerik kimliğiyle tekrar üretim kaydı alın.
2. DiziYou: TMDB TV eşleştirmesi → arama seçicileri → bölüm URL'si → `diziyouPlayer` seçicisi. Sentetik başarılı örnek geçiyor; güncel site HTML'si henüz doğrulanmadı.
3. HDFilmCehennemi: içerik eşleştirmesi, HTTP durumu ve embed ayrıştırmasını ayrı aşamalarda ölçün. `[]` sonuca bakarak engelleme veya bölge kısıtı iddia etmeyin.
4. FilmModu: `about:error` sayfasının kaynağı ve HTTP/redirect zincirini belirleyin. MUM geçersiz URL'yi süzer; bu, site hatasının düzeltildiği anlamına gelmez.
5. Üç sağlayıcı için kişisel veri içermeyen HTML fixture'ları ekleyin; ardından yalnız kanıtlanan parser farklarını düzeltin. Oynatma doğrulamasını ayrı Windows matrisiyle yapın.

Yeni build, adapter ve manifest testleri bu ilk geliştirme altyapısını doğrular. Canlı kaynak erişimi ve video oynatma bu teslimatta doğrulanmamıştır.
