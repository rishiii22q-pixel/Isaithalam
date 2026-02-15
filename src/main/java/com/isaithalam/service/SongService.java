package com.isaithalam.service;

import com.isaithalam.model.Song;
import com.isaithalam.repository.SongRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class SongService {
    private final SongRepository songRepository;

    public SongService(SongRepository songRepository) {
        this.songRepository = songRepository;
    }

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Song getSongById(Long id) {
        return songRepository.findById(id).orElse(null);
    }

    public List<Song> getTrending() {
        return songRepository.findTop10ByOrderByPlaysDesc();
    }

    public List<Song> getFeatured() {
        return songRepository.findByFeaturedTrue();
    }

    public List<Song> getLiked() {
        return songRepository.findByLikedTrue();
    }

    public List<Song> search(String query) {
        return songRepository.search(query);
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
