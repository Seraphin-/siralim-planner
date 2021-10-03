# Siralim Planner

This is a fan-made tool designed to simplify the process of planning builds for Siralim Ultimate. Further details on the tool are available
on the Info page of the tool: [https://berated-bert.github.io/siralim-planner/](https://berated-bert.github.io/siralim-planner/).

## About the source code

This is a front-end only React app. It uses a simple python script to read in data from the [Siralim Ultimate Compendium](https://docs.google.com/spreadsheets/d/1qvWwf1fNB5jN8bJ8dFGAVzC7scgDCoBO-hglwjTT4iY/edit#gid=0) such that it can be visualised via the React app.

## Running the app locally

Running the app locally requires NodeJS and npm. To run the app, first install the packages via:

    npm install

Then simply run it via

    npm start

## Updating the database

In order to update the database to the latest version of the [Siralim Ultimate Compendium](https://docs.google.com/spreadsheets/d/1qvWwf1fNB5jN8bJ8dFGAVzC7scgDCoBO-hglwjTT4iY/edit#gid=0), simply
download a copy of the Traits sheet of the Compendium, save it to `data/Siralim Ultimate Compendium - Traits.csv`, and run:

    python build_data.py

This will convert the `.csv` file into a `.json` file, which is stored under `src/data/data.json` and read in by the React app.

## Code documentation

Code documentation (produced by jsdocs) is available under [docs](docs).

## Other notes

### How the URL sharing works

The build sharing URL is comprised of three components:
* The party members (`b=`)
* The specialization code (`s=`)
* The anointment codes (`a=`)

#### Party members

In order to come up with a way of saving/loading builds without using a back-end server (like Grimtools.com), I needed some way
to uniquely identify monsters/traits so that they could be saved in the URL parameters. I was originally going to use the indexes
of the monsters within the Compendium, (i.e. Abomination Bile is 1, Abomination Brute is 2, etc...), so that the URL would look as follows:

    https://siralim-tools.github.io/?build=1,123,34,15,44...

but this would cause problems later down the line when new creatures are added. If a creature was added before creature 123, for example, 
then any builds loaded from previous versions of the Compendium would break.

So instead I decided to take the hash of the family + creature + trait. This should be more robust as the family, creature and traits don't
tend to change between patches. I chose a hash length of 6 (in order to minimise potential collisions). So the result is a unique 6-character
string that represents each monster, e.g. Iron Golem just happens to be `ef5667` and will always be `ef5667` unless its family, creature or
the name of its trait changes at some point. 

#### Specialization code

The specialization code string is much simpler - it is a two-character identifier for a specialization. I came up with these 
identifiers myself. For a list of them, see [data/steam-guide/specializations.csv](data/steam-guide/specializations.csv).

#### Anointment codes

The anointment codes are three-character representation of a particular perk. The first two characters is the specialization code
that the perk belongs to, and the third letter is a letter representing the index of the perk within the list of that specialization's
perks, i.e. the first perk in Bloodmage, "Bleed Out", has the anointment code `BMA`, the second perk "Blood Clot" has `BMB`, and so on.

I don't think the order of the perks within a specialization will ever change but if they do, it will only be a minor
inconvenience when loading old builds.

## TODO

At this stage I've pretty much reached the limit of what I can do with a pure front-end app. I would like to add other things to the app
such as artifact stats, nether stone traits, etc, but this is simply not possible without causing the build string to grow to ridiculous lengths.
The only way to achieve this would be to have a back end app, such as a Flask app, that could encode a build into a short URL (like how Grimtools does it).
This would mean I could no longer host it for free on GitHub pages, and would need to think about security, maintenance etc... 
so it is a somewhat long-term goal at the moment.

The list of features to do/completed are as follows:

- Build a back-end app to allow for more features such as artifact stats and nether stone traits
- Improve accessibility of the site (ongoing)
- ~~Make the creature selection table sortable~~
- ~~Allow users to select anointments~~
- ~~Allow users to select a specialization~~
- ~~Incorporate creature stats into the app~~
- ~~Tidy up the source code (it is a bit messy - it needs refactoring/commenting/documenting etc).~~ (it's as tidy as it's going to get for now)
- ~~Make the design responsive, i.e. work nicely on mobile.~~
- ~~Allow import of builds from the game (this may be tricky)~~
- ~~Find a way to add the monster sprites to the planner. If anybody knows a database that maps monster names to their respective sprites, please let me know!~~

## License and contact

The software is licensed under the open source GNU GPL 3.0 License.

Please feel free to fork the repository and/or submit pull requests/issues etc. If you have any other comments/feedback feel free to message me on Discord - BeratedBert#6292.

This tool is not affiliated with Thylacine Studios.

Creature sprites, creature stats and the mapping between trait -> creature sprite are sourced from the [Siralim Ultimate API](https://github.com/rovermicrover/siralim-ultimate-api).

The list of specializations and perks is from the [guide on Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=2190265173).