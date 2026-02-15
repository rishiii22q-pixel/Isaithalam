package com.isaithalam.service;

import com.isaithalam.model.Playlist;
import com.isaithalam.model.Song;
import com.isaithalam.repository.PlaylistRepository;
import com.isaithalam.repository.SongRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PlaylistService {
    private final PlaylistRepository playlistRepository;
    private final SongRepository songRepository;

    public PlaylistService(PlaylistRepository playlistRepository, SongRepository songRepository) {
        this.playlistRepository = playlistRepository;
        this.songRepository = songRepository;
    }

    public List<Playlist> getUserPlaylists(Long userId) {
        return playlistRepository.findByUserId(userId);
    }

    public List<Playlist> getAllPlaylists() {
        return playlistRepository.findAll();
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id).orElse(null);
    }

    public Playlist createPlaylist(String name, String description, Long userId) {
        Playlist playlist = new Playlist();
        playlist.setName(name);
        playlist.setDescription(description);
        playlist.setUserId(userId);
        playlist.setCoverUrl("/images/playlist-default.svg");
        return playlistRepository.save(playlist);
    }

    public Playlist addSongToPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepository.findById(playlistId).orElse(null);
        Song song = songRepository.findById(songId).orElse(null);
        if (playlist != null && song != null) {
            if (!playlist.getSongs().contains(song)) {
                playlist.getSongs().add(song);
                playlistRepository.save(playlist);
            }
        }
        return playlist;
    }

    public Playlist removeSongFromPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepository.findById(playlistId).orElse(null);
        if (playlist != null) {
            playlist.getSongs().removeIf(s -> s.getId().equals(songId));
            playlistRepository.save(playlist);
        }
        return playlist;
    }

    public void deletePlaylist(Long id) {
        playlistRepository.deleteById(id);
    }
}
