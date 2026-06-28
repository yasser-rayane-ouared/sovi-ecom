import urllib.request

def resolve_redirect(name, url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        response = urllib.request.urlopen(req)
        final_url = response.geturl()
        print(f"{name}:\nOriginal: {url}\nResolved: {final_url}\n")
    except Exception as e:
        print(f"{name}: Error for {url}: {e}\n")

print("Resolving redirects...")
resolve_redirect("Auto / Car Detailing", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHQUda8SbymF8FR_FOUUvEZ9kNid-6lfJV3SS2rSxQK84je7TOTQCdBD0GkenIc0I0Z8Tw_hEQYWatz89YUDqVrnKMuQPdhpgunM7j8esufQpYG9CLgds7APK7NI03iO-gQiWVVY-_SEqhkBHp04qT-Ilw=")
resolve_redirect("Fitness / Neon", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG3_NM_sdgcsE1UjoseT2ZcDmaAvhGATeXNKKpqhdUL4zFmzEwAFo4WtLX8Kx0JBszzbAfd8lxBg1Jg0ibaYNXoAN7tNEgBw0PT4oIod1PpsSh3CCUTgUnNOGFlKJ884wMQSZxkaW28CDI8Kq6o-TJDhwyEYPecSqw=")
resolve_redirect("Food / Restaurant", "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGlUOkuzFcU7OFWhAPbbhlFgM0gSPOrWJeljX3xap8T5Ac8W7R2zcgJHqsfav_IcaFWGAbGMcyLeHAkFwA6s2F9wLFjU3c0E7khjTVqCI5HcwknosJyw6t72J-GjUK7JxbjGqt4G4KqDOHzpok=")
