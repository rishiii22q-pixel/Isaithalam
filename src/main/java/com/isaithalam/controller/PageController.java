package com.isaithalam.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String root() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/home")
    public String home() {
        return "home";
    }

    @GetMapping("/search")
    public String search() {
        return "search";
    }

    @GetMapping("/playlist/{id}")
    public String playlist() {
        return "playlist";
    }
}
