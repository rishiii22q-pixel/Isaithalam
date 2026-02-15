package com.isaithalam.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.isaithalam.model.Song;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;

@Service
public class MusicApiService {

    private final String API_BASE_URL = "https://saavn.me";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MusicApiService(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public List<Song> searchSongs(String query) {
        List<Song> songs = new ArrayList<>();
        try {
            String url = API_BASE_URL + "/search/songs?query=" + query;
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode response = responseEntity.getBody();

            if (response != null && response.has("data") && response.get("data").has("results")) {
                JsonNode results = response.get("data").get("results");
                for (JsonNode item : results) {
                    songs.add(mapToSong(item));
                }
            }
        } catch (Exception e) {
            System.err.println("Saavn API Search Error: " + e.getMessage());
            // Fallback to iTunes
            System.out.println("Falling back to iTunes API...");
            songs = searchItunesFallback(query);
        }
        return songs;
    }

    public List<Song> getTrending() {
        List<Song> songs = new ArrayList<>();
        try {
            // Use search fallback for trending
            String url = API_BASE_URL + "/search/songs?query=latest tamil"; 
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<JsonNode> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            JsonNode response = responseEntity.getBody();

             if (response != null && response.has("data") && response.get("data").has("results")) {
                JsonNode results = response.get("data").get("results");
                for (JsonNode item : results) {
                    songs.add(mapToSong(item));
                }
            }
        } catch (Exception e) {
            System.err.println("Music API Trending Error: " + e.toString());
            e.printStackTrace();
        }
        return songs;
    }
    
    public Song getSongById(Long id) {
        try {
            // Try iTunes lookup
            String url = "https://itunes.apple.com/lookup?id=" + id;
            String jsonResponse = restTemplate.getForObject(url, String.class);
            JsonNode response = objectMapper.readTree(jsonResponse);
            
            if (response != null && response.has("results")) {
                JsonNode results = response.get("results");
                if (results.isArray() && results.size() > 0) {
                    JsonNode item = results.get(0);
                    Song song = new Song();
                    song.setExternalId(String.valueOf(item.get("trackId").asLong()));
                    song.setId(item.get("trackId").asLong());
                    
                    song.setTitle(item.path("trackName").asText() + " (Preview)");
                    song.setArtistName(item.path("artistName").asText());
                    song.setAlbumName(item.path("collectionName").asText());
                    song.setDuration(item.path("trackTimeMillis").asInt() / 1000);
                    song.setCoverImageUrl(item.path("artworkUrl100").asText().replace("100x100", "600x600"));
                    song.setAudioUrl(item.path("previewUrl").asText());
                    
                    song.setGenre(item.path("primaryGenreName").asText());
                    song.setPlays(1000 + (long)(Math.random() * 10000));
                    song.setFeatured(false);
                    song.setLiked(false);
                    return song;
                }
            }
        } catch (Exception e) {
            System.err.println("Music API Get Song Error: " + e.getMessage());
        }
        return null;
    }

    private Song mapToSong(JsonNode item) {
        Song song = new Song();
        String idStr = item.has("id") ? item.get("id").asText() : "";
        song.setExternalId(idStr);
        // Temporary ID generation for frontend keys
        song.setId((long) idStr.hashCode()); 

        song.setTitle(getString(item, "name"));
        
        // Artist handling
        if (item.has("primaryArtists")) {
             song.setArtistName(getString(item, "primaryArtists"));
        } else if (item.has("artists")) {
             JsonNode artists = item.get("artists");
             if (artists.has("primary") && artists.get("primary").isArray() && artists.get("primary").size() > 0) {
                 song.setArtistName(getString(artists.get("primary").get(0), "name"));
             } else {
                 song.setArtistName("Unknown Artist");
             }
        } else {
            song.setArtistName("Unknown Artist");
        }

        song.setAlbumName(getString(item, "album"));
        if (item.has("album") && item.get("album").isObject() && item.get("album").has("name")) {
             song.setAlbumName(item.get("album").get("name").asText());
        }

        song.setDuration(item.has("duration") ? item.get("duration").asInt() : 0);
        
        // Images
        song.setCoverImageUrl(""); // default
        if (item.has("image")) {
            JsonNode imageNode = item.get("image");
            if (imageNode.isArray() && imageNode.size() > 0) {
                // Get the last one (highest quality)
                JsonNode img = imageNode.get(imageNode.size() - 1);
                if (img.has("url")) song.setCoverImageUrl(img.get("url").asText());
                else if (img.has("link")) song.setCoverImageUrl(img.get("link").asText());
                else if (img.isTextual()) song.setCoverImageUrl(img.asText());
            } else if (imageNode.isTextual()) {
                song.setCoverImageUrl(imageNode.asText());
            }
        }
        
        // Audio URL
        song.setAudioUrl(""); // default
        if (item.has("downloadUrl") && item.get("downloadUrl").isArray()) {
            JsonNode urls = item.get("downloadUrl");
            if (urls.size() > 0) {
                 JsonNode download = urls.get(urls.size() - 1);
                 if (download.has("url")) song.setAudioUrl(download.get("url").asText());
                 else if (download.has("link")) song.setAudioUrl(download.get("link").asText());
                 else if (download.isTextual()) song.setAudioUrl(download.asText());
            }
        } else if (item.has("url")) {
             String url = item.get("url").asText();
             if (url.endsWith(".mp3") || url.endsWith(".m4a")) {
                 song.setAudioUrl(url);
             }
        }

        song.setGenre("Global");
        song.setPlays(1000 + (long)(Math.random() * 50000));
        song.setFeatured(false);
        song.setLiked(false);
        
        return song;
    }

    private List<Song> searchItunesFallback(String query) {
        List<Song> songs = new ArrayList<>();
        try {
            String url = "https://itunes.apple.com/search?term=" + query + "&entity=song&limit=10";
            String jsonResponse = restTemplate.getForObject(url, String.class); // Fetch as String
            JsonNode response = objectMapper.readTree(jsonResponse); // Parse manually
            
            if (response != null && response.has("results")) {
                for (JsonNode item : response.get("results")) {
                    Song song = new Song();
                    song.setExternalId(String.valueOf(item.get("trackId").asLong()));
                    song.setId(item.get("trackId").asLong());
                    
                    song.setTitle(item.path("trackName").asText() + " (Preview)"); // Mark as preview
                    song.setArtistName(item.path("artistName").asText());
                    song.setAlbumName(item.path("collectionName").asText());
                    song.setDuration(item.path("trackTimeMillis").asInt() / 1000);
                    song.setCoverImageUrl(item.path("artworkUrl100").asText().replace("100x100", "600x600")); // Get higher res
                    song.setAudioUrl(item.path("previewUrl").asText());
                    
                    song.setGenre(item.path("primaryGenreName").asText());
                    song.setPlays(1000 + (long)(Math.random() * 10000));
                    song.setFeatured(false);
                    song.setLiked(false);
                    
                    songs.add(song);
                }
            }
        } catch (Exception ex) {
            System.err.println("iTunes Fallback Error: " + ex.getMessage());
        }
        return songs;
    }

    private String getString(JsonNode node, String key) {
        return node.has(key) ? node.get(key).asText() : "";
    }
}
