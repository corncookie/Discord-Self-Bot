/**
 * @file Searches MovieCommand - Find information about a movie using TheMovieDatabase  
 * **Aliases**: `movie`
 * @module
 * @category searches
 * @name tmdb
 * @example tmdb Pokemon 2000
 * @param {StringResolvable} MovieName Name of the movie you want to find
 * @returns {MessageEmbed} Information about the requested movie
 */

const moment = require('moment'),
  request = require('snekfetch'),
  {Command} = require('discord.js-commando'),
  {MessageEmbed} = require('discord.js'),
  {deleteCommandMessages} = require('../../util.js');

module.exports = class MovieCommand extends Command {
  constructor (client) {
    super(client, {
      name: 'tmdb',
      memberName: 'tmdb',
      group: 'searches',
      aliases: ['movie'],
      description: 'Finds movies on TheMovieDB',
      format: 'MovieName [release_year_movie]',
      examples: ['tmdb Ocean\'s Eleven 2001'],
      guildOnly: false,
      throttling: {
        usages: 2,
        duration: 3
      },
      args: [
        {
          key: 'name',
          prompt: 'What movie do you want to find?',
          type: 'string'
        }
      ]
    });
  }

  async run (msg, {name}) {
    try {
      const movieEmbed = new MessageEmbed(),
        movieSearch = await request.get('https://api.themoviedb.org/3/search/movie')
          .query('api_key', process.env.moviedbkey)
          .query('query', name)
          .query('include_adult', false),
        movieStats = await request.get(`https://api.themoviedb.org/3/movie/${movieSearch.body.results[0].id}`)
          .query('api_key', process.env.moviedbkey);

      movieEmbed
        .setTitle(movieStats.body.title)
        .setURL(`https://www.themoviedb.org/movie/${movieStats.body.id}`)
        .setColor(msg.guild ? msg.member.displayHexColor : '#7CFC00')
        .setImage(`https://image.tmdb.org/t/p/original${movieStats.body.backdrop_path}`)
        .setThumbnail(`https://image.tmdb.org/t/p/original${movieStats.body.poster_path}`)
        .setDescription(movieStats.body.overview)
        .addField('Runtime', `${movieStats.body.runtime} minutes`, true)
        .addField('User Score', movieStats.body.vote_average, true)
        .addField('Status', movieStats.body.status, true)
        .addField('Release Date', moment(movieStats.body.release_date).format('MMMM Do YYYY'), true)
        .addField('Collection', movieStats.body.belongs_to_collection ? movieStats.body.belongs_to_collection.name : 'none', true)
        .addField('IMDB Page', movieStats.body.imdb_id ? `[Click Here](http://www.imdb.com/title/${movieStats.body.imdb_id})` : 'none', true)
        .addField('Genres', movieStats.body.genres.length ? movieStats.body.genres.map(genre => genre.name).join(', ') : 'None on TheMovieDB');

      deleteCommandMessages(msg, this.client);

      return msg.embed(movieEmbed);
    } catch (err) {
      deleteCommandMessages(msg, this.client);

      return msg.reply(`no movies found for \`${name}\``);
    }
  }
};