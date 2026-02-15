package com.isaithalam.controller;

import com.isaithalam.model.Song;
import com.isaithalam.service.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
public class SongController {
    private final SongService songService;

    public SongController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping
    public List<Song> getAllSongs() {
        return songService.getAllSongs();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSong(@PathVariable Long id) {
        Song song = songService.getSongById(id);
        return song != null ? ResponseEntity.ok(song) : ResponseEntity.notFound().build();
    }

    @GetMapping("/trending")
    public List<Song> getTrending() {
        return songService.getTrending();
    }

    @GetMapping("/featured")
    public List<Song> getFeatured() {
        return songService.getFeatured();
    }

    @GetMapping("/liked")
    public List<Song> getLiked() {
        return songService.getLiked();
    }

    @GetMapping("/search")
    public List<Song> search(@RequestParam String q) {
        return songService.search(q);
    }

    @GetMapping("/genre/{genre}")
    public List<Song> getByGenre(@PathVariable String genre) {
        return songService.getByGenre(genre);
    }

    @GetMapping("/genres")
    public List<String> getGenres() {
        return songService.getAllGenres();
    }

    @PutMapping("/{id}/play")
    public ResponseEntity<Song> incrementPlay(@PathVariable Long id) {
        Song song = songService.incrementPlays(id);
        return song != null ? ResponseEntity.ok(song) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id) {
        Song song = songService.toggleLike(id);
        if (song != null) {
            return ResponseEntity.ok(Map.of("liked", song.isLiked()));
        }
        return ResponseEntity.notFound().build();
    }
}
