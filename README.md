# ModWare

#### Hackathon Project originally submitted to PennApps XVII in the Spring of 2018. This project can also be found on Devpost [here](https://devpost.com/software/modware).

## Inspiration
We really are passionate about hardware, however many hackers in the community, especially those studying software-focused degrees, miss out on the experience of working on projects involving hardware and experience in vertical integration.
To remedy this, we came up with modware. Modware provides the toolkit for software-focused developers to branch out into hardware and/or to add some verticality to their current software stack with easy to integrate hardware interactions and displays.

## What it does
The modware toolkit is a baseboard that interfaces with different common hardware modules through magnetic power and data connection lines as they are placed onto the baseboard.
Once modules are placed on the board and are detected, the user then has three options with the modules: to create a "wired" connection between an input type module (LCD Screen) and an output type module (knob), to push a POST request to any user-provided URL, or to request a GET request to pull information from any user-provided URL.
These three functionalities together allow a software-focused developer to create their own hardware interactions without ever touching the tedious aspects of hardware (easy hardware prototyping), to use different modules to interact with software applications they have already built (easy hardware interface prototyping), and to use different modules to create a physical representation of events/data from software applications they have already built (easy hardware interface prototyping).

## How we built it
Modware is a very large project with a very big stack: ranging from a fullstack web application with a server and database, to a desktop application performing graph traversal optimization algorithms, all the way down to sending I2C signals and reading analog voltage.
We had to handle the communication protocols between all the levels of modware very carefully. One of the interesting points of communication is using neodymium magnets to conduct power and data for all of the modules to a central microcontroller. Location data is also kept track of as well using a 9-stage voltage divider, a series circuit going through all 9 locations on the modware baseboard.
All of the data gathered at the central microcontroller is then sent to a local database over wifi to be accessed by the desktop application. Here the desktop application uses case analysis to solve the NP-hard problem of creating optimal wire connections, with proper geometry and distance rendering, as new connections are created, destroyed, and modified by the user. The desktop application also handles all of the API communications logic.
The local database is also synced with a database up in the cloud on Heroku, which uses the gathered information to wrap up APIs in order for the modware hardware to be able to communicate with any software that a user may write both in providing data as well as receiving data.

## Challenges we ran into
The neodymium magnets that we used were plated in nickel, a highly conductive material. However magnets will lose their magnetism when exposed to high heat and neodymium magnets are no different. So we had to extremely careful to solder everything correctly on the first try as to not waste the magnetism in our magnets. These magnets also proved very difficult to actually get a solid data and power and voltage reader electricity across due to minute differences in laser cut holes, glue residues, etc. We had to make both hardware and software changes to make sure that the connections behaved ideally.

## Accomplishments that we're proud of
We are proud that we were able to build and integrate such a huge end-to-end project. We also ended up with a fairly robust magnetic interface system by the end of the project, allowing for single or double sized modules of both input and output types to easily interact with the central microcontroller.

## What's next for ModWare
More modules!
