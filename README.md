# Sudoku javascript

This project consist in a frontend-only sudoku game. The goal is to have a fully playable sudoku interface, with keyboard inputs, buttons, rule check, intuitive interface, which would be able to take additional rules into account.

## Todo list

- [x] Sudoku game logic

Interface
- [x] Grid generation
- [x] Cursor
- [x] Filled numbers
- [x] Corner annotated numbers
- [x] Center annotated numbers
- [x] Mouse support
- [x] Keyboard support
- [x] Selection feedback
- [x] Prevent text from blocking click
- [ ] Load random sudoku layout
- [ ] List all available sudokus

Persistance
- [ ] Write temporary data in cookie ?
- [ ] Load data from cookie ?

Style
- [ ] Grid size on page
- [ ] Buttons layout
- [ ] Overall site look
- [ ] Dark/Light modes

Load Sudoku from file
- [x] Define or find basic description format
- [x] Parser
- [ ] Writable additional rules

Additional rules
- [ ] Define tasks to add rules

History system
- [ ] Write actions
- [ ] Undo / Redo

Help system
- [ ] Highlight all instances of a number and it's possible positions
- [ ] Highlight the cells a selected cell blocks

## About the project

I love playing sudoku, and playing a bit on my computer made me want to develop my own game interface, in order to learn a bit more about javascript. I also like the challenge of thinking an intuitive interface.

I also want the game to be adaptative, so that people can implement new rules, such as chess moves restraints.
