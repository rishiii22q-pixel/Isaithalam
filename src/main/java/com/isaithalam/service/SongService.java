package com.isaithalam.service;

import com.isaithalam.model.Song;
import com.isaithalam.repository.SongRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SongService {
    private final SongRepository songRepository;

    private final MusicApiService musicApiService;

    public SongService(SongRepository songRepository, MusicApiService musicApiService) {
        this.songRepository = songRepository;
        this.musicApiService = musicApiService;
    }

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Song getSongById(Long id) {
        Song song = songRepository.findById(id).orElse(null);
        if (song == null) {
            // Try external API
            song = musicApiService.getSongById(id);
        }
        return song;
    }

    public List<Song> getTrending() {
        // Mix local trending with global trending
        List<Song> local = songRepository.findTop10ByOrderByPlaysDesc();
        List<Song> global = musicApiService.getTrending();
        
        // Combine them (local first)
        local.addAll(global);
        return local;
    }

    public List<Song> getFeatured() {
        return songRepository.findByFeaturedTrue();
    }

    public List<Song> getLiked() {
        return songRepository.findByLikedTrue();
    }

    public List<Song> search(String query) {
        List<Song> local = songRepository.search(query);
        List<Song> global = musicApiService.searchSongs(query);
        
        local.addAll(global);
        return local;
    }

    public List<Song> getByGenre(String genre) {
        return songRepository.findByGenreIgnoreCase(genre);
    }

    public List<String> getAllGenres() {
        return songRepository.findAllGenres();
    }

    public Song incrementPlays(Long id) {
        Song song = songRepository.findById(id).orElse(null);
        if (song != null) {
            song.setPlays(song.getPlays() + 1);
            songRepository.save(song);
        }
        return song;
    }

    public Song toggleLike(Long id) {
        Song song = songRepository.findById(id).orElse(null);
        if (song != null) {
            song.setLiked(!song.isLiked());
            songRepository.save(song);
        }
        return song;
    }
}
