//requirements
const { geniusAPI } = require('./config.json');
const { optimized_query } = require('./config.json');
const fetch = require("node-fetch");
const cio = require('cheerio-without-node-native');
const requestpromise = require('request-promise');
const { spotifyToken } = require('./config.json')
const { spotifyMarket } = require('./config.json')

//checkOptions of the function "options"
const checkOptions = (options) => {
    let { apiKey, title, artist } = options;
    switch ('undefined') {
        case typeof apiKey:
            throw '"apiKey" property is missing from options';
        case typeof title:
            throw '"title" property is missing from options';
        case typeof artist:
            throw '"artist" property is missing from options';
        default:
            break;
    }
};

//GetTheTitleOfTheSong
const getTitle = (title, artist) => {
    return `${title} ${artist}`
        .toLowerCase()
        .replace(/ *\([^)]*\) */g, '')
        .replace(/ *\[[^\]]*]/, '')
        .replace(/feat.|ft./g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

//do all the stuff
try {
    try {
        let songtitle = "";
        let artistname = "";
        //getTheActualSongFromSpotify
        fetch(`https://api.spotify.com/v1/me/player/currently-playing?market=${spotifyMarket}`, {
                "mode": 'cors',
                "method": `GET`,
                "headers": {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyToken}`
                }
            })
            .then(response => response.json())
            .then(response => {
                if (response.length === 0) {
                    throw ("Check your token, the response is blank!")
                }
                songtitle = response.item.name
                artistname = response.item.album.artists[0].name
                const searchUrl = 'https://api.genius.com/search?q=';
                const options = {
                    apiKey: geniusAPI,
                    title: songtitle,
                    artist: artistname,
                    optimizeQuery: optimized_query
                }
                let resp;
                checkOptions(options);
                let { apiKey, title, artist, optimizeQuery = false } = options;
                const song = optimizeQuery ? getTitle(title, artist) : `${title} ${artist}`;
                const reqUrl = `${searchUrl}${encodeURI(song)}`;
                //getListOfSongs
                fetch(reqUrl, {
                        "mode": 'cors',
                        "method": `GET`,
                        "headers": {
                            Authorization: 'Bearer ' + apiKey,
                        }
                    })
                    .then(response => response.json())
                    .then(response => {
                        resp = response
                        if (response.length == 49) {
                            throw ("The song doesn't have any lyric")
                        }
                        songtitle = resp.response.hits[0].result.full_title
                        id = resp.response.hits[0].result.id
                        image = resp.response.hits[0].result.song_art_image_url
                        url = resp.response.hits[0].result.url
                            //getLyrics
                        requestpromise(url)
                            //let's scrape the lyric
                            .then(function(html) {
                                const $ = cio.load(html);
                                let lyrics = $('div[class="lyrics"]').text();
                                if (!lyrics) {
                                    $('div[class^="Lyrics__Container"]').each((i, elem) => {
                                        if ($(elem).text().length !== 0) {
                                            let snippet = $(elem).html()
                                                .replace(/<br>/g, '\n')
                                                .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, '');
                                            lyrics += $('<textarea/>').html(snippet).text() + '\n\n';
                                        }
                                    })
                                }
                                console.log("Link: " + url)
                                console.log("Song Title: " + songtitle)
                                console.log("Image Link: " + image)
                                console.log("Song Id: " + id)
                                console.log("Lyrics:\n\n" + lyrics)
                            })
                            .catch(function(err) {
                                throw err;
                            });
                    })
                    .catch(function(err) {
                        throw err;
                    });
            })
    } catch (e) {
        throw e;
    }
} catch (e) {
    throw e;
};