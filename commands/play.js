const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require("discord-ytdl-core");
const ytpl = require('ytpl');
var URL = require('url');
const path = require('path');
const youtubeUrlRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
const validUrlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
const spotifyRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(track|playlist|artist|episode|album)\/)((?:\w|-){22})/



module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Requests a song to play on the musicbot.')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('Enter a valid url or search term!')
                .setRequired(true)),
    async execute(interaction) {
        console.log("TEST_______________________-----------------------===================++++++++++++++++++++++++")
        const { musicQueue, addQueue, youtubeSearch, getSpotifyPlaylist, playUrl, updateQueue, getSpotifyArtist, getSpotifyAlbum, fs, getSpotifySongs } = require("../index.js")
        if (!interaction.member.voice.channel) return interaction.reply({ content: 'Please enter a voice channel to use this feature!', ephemeral: true });
        if (!interaction.member.voice.channel.joinable) return interaction.reply({ content: 'Unable to join your current voice channel!', ephemeral: true });

        const queue = musicQueue[interaction.guildId]
        var input = interaction?.options?.getString('input')
        var result = []
        var promises = []

        if (interaction.notCommand) {
            interaction.deferReply = async function() {}
            interaction.reply = async function() {}
            interaction.editReply = async function({content, ephemeral}) {
                console.log("OUTPUT: "+content, "ephemeral: "+ephemeral)
            }
            input = interaction.input;
            console.log("Input: "+input)
        }

        console.log("TEST2222222222222222222222222222222_______________________-----------------------===================++++++++++++++++++++++++")

        await interaction.deferReply({ ephemeral: true }).then(async ()=>{

            console.log("TEST3333333333333333333333333333333_______________________-----------------------===================++++++++++++++++++++++++")

            if (queue.following) return interaction.reply({ content: 'Unable to play anything because the bot is currently following a user!', ephemeral: true });


                if (input.match(validUrlRegex)) {

                if (input.match(youtubeUrlRegex)) {
                    var url_parts = URL.parse(input, true);
                    var query = url_parts.query;
                    if (query.list) {
                        console.log("Youtube Playlist!")
                        let playlist = await ytpl(input);

                            console.log("Playlist Length: "+playlist.items.length)

                            for (let index = 0; index < playlist.items.length; index++) {
                                promises.push(process())
                                async function process() {
                                    var item = playlist.items[index]
                                item.image = item.bestThumbnail.url
                                result.push(item)
                                }
                                
                            }



                    } else {
                        console.log("Youtube Video!")
                        promises.push(process())
                        async function process() {
                        let res = await ytdl.getBasicInfo(input)
                        res.videoDetails.url = res.videoDetails.video_url
                        res.videoDetails.image = res.videoDetails.thumbnails[res.videoDetails.thumbnails.length - 1].url
                        console.log("LENGTH:              "+res.videoDetails.lengthSeconds)
                        res.videoDetails.duration = res.videoDetails.lengthSeconds
                        console.log(res.videoDetails.thumbnails[res.videoDetails.thumbnails.length - 1].url)
                        result.push(res.videoDetails)
                        }
                    }
                    
                } else if (input.match(spotifyRegex)) {
                    var type = input.match(spotifyRegex)[1]
                    var id = input.match(spotifyRegex)[2]
    
                    if (type == "track") {
                        var inputs = input.split(",")
                        for (let index = 0; index < inputs.length; index++) {
                            const input = inputs[index];
                            inputs[index] = input.match(spotifyRegex)[2]
                        }
                        console.log("Spotify Song!")
                        let sresult = await getSpotifySongs(inputs)
                        sresult.forEach(sresult=>{
                            var track
                        promises.push(playSOng(sresult))
                        async function playSOng(sresult) {
                        track = await youtubeSearch(sresult.name + " " + sresult.artists.map(a => a.name).join(" "))
                        if (!track) return;
                        if (!track.duration) return;
                        console.log(track)
                        track.title = sresult.name
                        track.image = sresult.album.images[0].url
                        track.spotifyUrl = sresult.external_urls.spotify
                        track.author = sresult.artists.map(a => a.name).join(" ")
                        track.duration = hmsToSecondsOnly(track.duration)
                        result.push(track)
                        }
                        })
                        
                        
                    } else if (type == "playlist") {
                        console.log("Spotify Playlist!")
                        console.time('Fetch Spotify Playlist')
                        let spotifyRes = await getSpotifyPlaylist(id)
                        console.timeEnd('Fetch Spotify Playlist')

                    /* for (let index = 0; index < spotifyRes.data.tracks.items.length; index++) { */
                        /* var item = spotifyRes.data.tracks.items[index] */
                        spotifyRes.data.tracks.items.forEach((item,index)=>{
                            promises.push(
                            youtubeSearch(item.track.name + " " + item.track.artists.map(a => a.name).join(" ")).then(async res=>{
                            if (res == null) return;

                            console.log("Found: "+item.track.name)

                            res.title = item.track.name
                            res.image = item.track.album.images[0].url
                            res.spotifyUrl = item.track.external_urls.spotify
                            res.author = item.track.artists.map(a => a.name).join(" ")
                            if (res.duration) res.duration = hmsToSecondsOnly(res.duration)
                            result.push(res)
                        }))

                        })
                        
                        

                    /* } */
                    

                    } else if (type == "artist") {
                        console.log("Spotify Artist!")
                        await getSpotifyArtist(id).then(res => {
                                for (let index = 0; index < res.data.tracks.length; index++) {
                                    var item = res.data.tracks[index]
                                    promises.push(searchSong(item))
                                    async function searchSong(item) {
                                await youtubeSearch(item.name + " " + item.artists.map(a => a.name).join(" ")).then(res => {
                                    res.duration = hmsToSecondsOnly(res.duration)
                                    res.title = item.name
                                    res.image = item.album.images[0].url
                                    res.spotifyUrl = item.external_urls.spotify
                                    result.push(res)
    
                                })
                            }
                            }
                        })
                       
                    } else if (type == "album") {
                        console.log("Spotify Album!")
                        await getSpotifyAlbum(id).then(Albumres => {
                            for (let index = 0; index < Albumres.data.tracks.items.length; index++) {
                                var item = Albumres.data.tracks.items[index]
                                promises.push(searchSong(item))
                                async function searchSong(item) {
                                await youtubeSearch(item.name + " " + item.artists.map(a => a.name).join(" ")).then(res => {
                                    if (!result) return;
                                    console.log(Albumres.data)
                                    res.title = item.name
                                    res.image = Albumres.data.images[0].url
                                    res.spotifyUrl = item.external_urls.spotify
                                    result.push(res)
                                })
                            }
                            }
                        })
                    }
                } else {
                    console.log("Trying to play as URL!")

                    promises.push(playSOng(input))
                async function playSOng(url) {
                        var track = {url: url, title: "FILE"}
                        result.push(track)
                }

                }

                } else if (fs.existsSync(input)) {
                    console.log("Playing as LOCAL file!")
                    promises.push(playSong("/home/pixel/discordbot/ComfyMusicBeta/"+input))
                    async function playSong(input) {
                        let res = {duration: 0, url: input, title: path.parse(interaction.tempName).name}
                    result.push(res);
                    }
                } else {
                    console.log("Searching For Video: "+input)
                    promises.push(playSOng(input))
                    async function playSOng(input) {
                        let res = await youtubeSearch(input)
                        res.duration = hmsToSecondsOnly(res.duration)
                    result.push(res);
                    }
                }
                
          

            
            
            await promises[0].then(async () => {
                console.log("FIRST SONG DONE!")
                if (queue.queue.length > 0 && queue.current) {
                    console.log("ALREADY PLAYING STUFF!")
                } else {
                    playUrl(result[0].url, interaction.member.voice.channel, { isLiveContent: result[0].isLiveContent, seconds: input.match(/.*t=([^&|\n|\t\s]+)s/i)?.[1], author: result[0].author }).then(async function () {
                        console.log("Started playing first song!")
                    })
                }

                console.log("Adding the rest of the songs!")
                            for (let index = 0; index < promises.length; index++) {
                                let promise = promises[index]
                                await promise
                                var res = result[index]
                                if (res == null) return;
                                addQueue(interaction.guildId, interaction.member.voice.channel, interaction.channel, { url: res.url, title: res.title, isLiveContent: res.isLiveContent, coverImage: res.image, requester: interaction.member, seconds: res.url.match(/.*t=([^&|\n|\t\s]+)s/), spotifyUrl: res.spotifyUrl, author: res.author, length: res.duration })
                            }
                                console.log("Finished Adding all of the songs!")
                                updateQueue(interaction.guildId)
                
            })


        promises[0].then(()=>{
            if (queue.queue.length > 0 && queue.current) {
                interaction.editReply({ content: `Adding ${result[0].title} to the queue!`, ephemeral: true });
            } else {
                interaction.editReply({ content: `Playing ${result[0].title}!`, ephemeral: true });
            }
        })
         console.log("Promises: "+promises.length)

        })

        

    }
}

function hmsToSecondsOnly(str) {
    var p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}