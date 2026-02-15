package com.isaithalam.controller;

import com.isaithalam.model.Playlist;
import com.isaithalam.service.PlaylistService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {
    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<Playlist> getAllPlaylists() {
        return playlistService.getAllPlaylists();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylist(@PathVariable Long id) {
        Playlist p = playlistService.getPlaylistById(id);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "My Playlist");
        String description = body.getOrDefault("description", "");
        Long userId = Long.parseLong(body.getOrDefault("userId", "1"));
        Playlist playlist = playlistService.createPlaylist(name, description, userId);
        return ResponseEntity.ok(playlist);
    }

    @PostMapping("/{id}/songs/{songId}")
    public ResponseEntity<Playlist> addSong(@PathVariable Long id, @PathVariable Long songId) {
        Playlist p = playlistService.addSongToPlaylist(id, songId);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<Playlist> removeSong(@PathVariable Long id, @PathVariable Long songId) {
        Playlist p = playlistService.removeSongFromPlaylist(id, songId);
        return p != null ? ResponseEntity.ok(p) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlaylist(@PathVariable Long id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
