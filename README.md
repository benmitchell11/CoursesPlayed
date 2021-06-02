# GiveMe

> GiveMe is an online platform where kiwis can donate their unwanted items to other kiwis,
  empowering the NZ community to improve sustainability and reduce the waste caused by unwanted products.

# Setup
To get started, clone this repo and then: 

```
cd GiveMe
npm install
npm run knex migrate:latest
npm run knex seed:run
npm run dev
```
You can find the server runing on http://localhost:3000

## User stories 
1. As a user I want to be able to register. 
1. As a user I want to be able to sign in. 
1. As a user I want to be able to search for a specific item. 
1. As a user I want to be able to view the products based on categories. 
1. As a user I want to be able to list an item to give away. 
1. As a user I want to be able to view an item with a description.
1. As a user I want to be able to inquire about an item I am interested in.
1. As a user I want to be able to contact GiveMe organisation 

## MVP
1. Sign in and register functionality
1. Has at least one product category. 
1. List view of products 
1. Display items with description  
1. Search bar 
1. Form to Add/List item
1. View contact details of the person who listed an item. 
1. Testing 
1. Contact form 

### CSS
In this projct we have used Sass and very little Bulma to style the website.

## Pages 
1. Sign in 
1. Register 
1. Landing page (About)
1. Home page 
1. Item list page 
1. Add/list item page 
1. Item description page 
1. Contact Us page 

## Stretch 
1. Notify the person who listed product when someone isinterested
1. Use SASS with Bulma 
1. Functionality to allow a user to ask questions about a specific item 
1. Grid view 
1. Delete/Edit listing 
1. Upload more than one item/product image 

## Diagarm 
![Components](docs/Components.jpg)
![Components](docs/Database.jpg)

## Dependencies 
- [x] package.json 
- [x] jest/supertest - for testing 
- [x] Bulma 
- [x] authenticare
- [x] cloudinary
- [x] webpack
- [x] emailjs-com
- [x] express
- [x] font-awesome
- [x] knex
- [x] sqlite3


## User interface (proposal)

[Wireframe source on Whimsical](https://whimsical.com/DUMCHFWiwkCDuKRdxJXr1T)

![Landing](docs/Landing.png)
![Home](docs/Home.png)
![Home (Signed in)](docs/Home-(Signed-In).png)
![Register](docs/Register.png)
![Sign In](docs/Sign-In.png)
![Item List](docs/Item-List.png)
![Item Listing](docs/Item-Listing.png)
![List an Item](docs/List-an-Item.png)
![Edit Account](docs/Edit-Account.png)


## Roles 

- Kahu - Git master
- Rafael - Product owner
- Ben - Scrum master 
- Karishma - Front-end lead

Initially, as a team, we decided to go with the above roles, but while working on the project, we become more flexible and adapted to roles as per the requirement at that time. All the team members were open to changing their roles as per the requirements so that we can achieve our goal (MVP) within the set timeframe. 


## Conflict resolution plan 

Before starting this project, we as a team decided to have some conflict resolution plan so that our experience on this project can be as smooth as possible. 

- As a team, we decided to voice out our opinions and not to hold back our thoughts. 
- We decided to keep our conversation open and respectful. 
- As a team, we decided to ask for help at the right time and not stay block for an extended period. 
- We decided to make a collective decision while keeping what is best for our project and team. 

