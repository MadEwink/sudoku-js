// TODO
//
// Highlight all instances of a number, and it's possible places

// check if digit in 1..max, useful for cell possible values (for fill, 0 is valid however) and for grid boundaries
function check_digit(digit, max) {
	return !(digit < 1 || digit > max)
}

function test() {
	grid.fill_cell(grid.cursor_pos[0]+1,grid.cursor_pos[1]+1, 1);
}

function move() {
	grid.cursor_pos[0] = 1;
}

class Cell {
	// max : the maximum value of a digit
	constructor(max) {
		this.max = max
		this.value = 0 // empty
		this.corner_indicators = new Array(this.max)
		this.center_indicators = new Array(this.max)
		this.color = "white"
		this.is_editable = true
		for (var digit = 1 ; digit <= this.max ; digit++) {
			this.corner_indicators[digit-1] = false
			this.center_indicators[digit-1] = false
		}
	}
	toggle_corner(digit) {
		if (!(this.is_editable && check_digit(digit,this.max)))
			return
		this.corner_indicators[digit-1] = !this.corner_indicators[digit-1]
	}
	toggle_center(digit) {
		if (!( this.is_editable && check_digit(digit,this.max)))
			return
		this.center_indicators[digit-1] = !this.center_indicators[digit-1]
	}
	fill(digit) {
		if (!this.is_editable || digit > this.max || digit < 0)
			return
		this.value = digit
	}
	erase() {
		if (!this.is_editable)
			return
		this.value = 0
		for (var digit = 0 ; digit < this.max ; digit++) {
			this.corner_indicators[digit] = false
			this.center_indicators[digit] = false
		}
	}
}

class Grid {

	constructor(width=9, height=9, max=9) {
		this.max = max
		this.width = width
		this.height = height
		// cells array
		this.cells = new Array(width)
		for (var x = 0 ; x < width ; x++)
		{
			this.cells[x] = new Array(height)
			for (var y = 0 ; y < height ; y++)
			{
				this.cells[x][y] = new Cell(this.max)
			}
		}
		// cursor
		this.cursor_pos = new Array(1,1);
		// selected cells
		this.selection = new Array();
		// HTML / SVG related
		this.cell_width = 10;
		this.uri = "http://www.w3.org/2000/svg"

	}
	
	/*=====================
	 * Single cell actions
	 *=====================
	 */

	// fill the cell in x,y (where 1,1 is top left and 9,9 is down right) with digit
	fill_cell(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return
		this.cells[x-1][y-1].fill(digit)
	}
	erase_cell(x,y) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return
		this.cells[x-1][y-1].erase()
	}
	toggle_cell_corner(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return
		this.cells[x-1][y-1].toggle_corner(digit)
	}
	toggle_cell_center(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return
		this.cells[x-1][y-1].toggle_center(digit)
	}

	/*========================
	 * Cursor related actions
	 *========================
	 */

	set_cursor_pos(x,y) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return
		this.cursor_pos[0] = x;
		this.cursor_pos[1] = y;
		this.updateCursorPos();
	}
	increment_cursor_x() {
		this.cursor_pos[0] += 1;
		if (this.cursor_pos[0] > this.max)
			this.cursor_pos[0] = 1
		this.updateCursorPos();
	}
	decrement_cursor_x() {
		this.cursor_pos[0] -= 1;
		if (this.cursor_pos[0] < 1)
			this.cursor_pos[0] = this.max
		this.updateCursorPos();
	}
	increment_cursor_y() {
		this.cursor_pos[1] += 1;
		if (this.cursor_pos[1] > this.max)
			this.cursor_pos[1] = 1
		this.updateCursorPos();
	}
	decrement_cursor_y() {
		this.cursor_pos[1] -= 1;
		if (this.cursor_pos[1] < 1)
			this.cursor_pos[1] = this.max
		this.updateCursorPos();
	}

	/*===========================
	 * Selection related actions
	 *===========================
	 */

	add_cell_to_selection(x,y) {
		// if cell already in selection do nothing
		for (var coord in this.selection) {
			if (coord[0] == x && coord[1] == y)
				return
		}
		this.selection.push([x,y])
	}
	remove_cell_from_selection(x,y) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			if (this.selection[i][0] == x && this.selection[i][1] == y)
				this.selection.splice(i)
		}
	}
	empty_selection() {
		this.selection = new Array()
	}
	fill_selected(digit) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			this.fill_cell(this.selection[i][0], this.selection[i][1], digit)
		}
	}
	erase_selected(action) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			this.erase_cell(this.selection[i][0], this.selection[i][1])
		}
	}
	toggle_corner_selected(digit) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			this.toggle_cell_corner(this.selection[i][0], this.selection[i][1], digit)
		}
	}
	toggle_center_selected(digit) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			this.toggle_cell_center(this.selection[i][0], this.selection[i][1], digit)
		}
	}

	/*============================
	 * Whole grid related actions
	 *============================
	 */

	// validate the solution according to classic sudoku rules
	classic_validate() {
		// check each column
		for (var x = 0 ; x < this.width ; x++)
		{
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var y = 0 ; y < this.height ; y++)
			{
				var digit = this.cells[x][y].value
				// if incorrect number
				if (!check_digit(digit,this.max))
					return false
				// if two of the same in the column
				if (found_digits[digit-1])
					return false
				found_digits[digit-1] = true
			}
			// TODO : check if it works (had issues with for in)
			for (var b in found_digits) {
				if (!b)
					return false
			}
		}
		// check each row
		for (var y = 0 ; y < this.height ; y++)
		{
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var x = 0 ; x < this.width ; x++)
			{
				var digit = this.cells[x][y].value
				// if incorrect number
				if (!check_digit(digit,this.max))
					return false
				// if two of the same in the row
				if (found_digits[digit-1])
					return false
				found_digits[digit-1] = true
			}
			for (var b in found_digits) {
				if (!b)
					return false
			}
		}
		// check each square
		for (var i = 0 ; i < (this.width/3)*(this.height/3) ; i++)
		{
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var x = 3*(i%3) ; x < 3*((i%3)+1) ; x++)
			{
				for (var y = 3*Math.floor(i/3) ; y < 3*(Math.floor((i+1)/3)) ; y++)
				{
					var digit = this.cells[x][y].value
					// if incorrect number
					if (!check_digit(digit,this.max))
						return false
					// if two of the same in the row
					if (found_digits[digit-1])
						return false
					found_digits[digit-1] = true
				}
			}
			for (var b in found_digits) {
				if (!b)
					return false
			}
		}
	}

	/*==============
	 * HTML related
	 *==============
	 */
	generate_grid() {
		var svg_grid = document.getElementById("grid");
		var viewbox = "" + (-this.cell_width) + " " + (-this.cell_width) + " " + (this.cell_width*(this.width+2)) + " " + (this.cell_width*(this.height+2));
		svg_grid.setAttribute("viewBox", viewbox);

		var g_element = document.createElementNS(this.uri,'g');
		g_element.setAttribute("id","cells");
		g_element.setAttribute("fill", "white");
		g_element.setAttribute("stroke", "black");
		g_element.setAttribute("stroke-width", "0.1");

		for (var y = 1 ; y <= this.height ; y++) {
			for (var x = 1 ; x <= this.width ; x++) {
				var rect_element = document.createElementNS(this.uri,'rect');
				var id = "" + x + "," + y;
				rect_element.setAttribute("id", id);
				rect_element.setAttribute("onclick", "grid.onCellClick(id)");
				rect_element.setAttribute("x", this.cell_width*(x-1));
				rect_element.setAttribute("y", this.cell_width*(y-1));
				rect_element.setAttribute("width", this.cell_width);
				rect_element.setAttribute("height", this.cell_width);
				g_element.appendChild(rect_element);
			}
		}
		svg_grid.appendChild(g_element);
		var g_element = document.createElementNS(this.uri, 'g');
		g_element.setAttribute("fill", "none");
		g_element.setAttribute("stroke", "black");
		g_element.setAttribute("stroke-width", "0.5");
		// 3x3 cells
		for (var x = 0 ; x < (this.width/3) ; x++) {
			for (var y = 0 ; y < (this.height/3) ; y++) {
				var rect_element = document.createElementNS(this.uri,'rect');
				rect_element.setAttribute("x", 3*this.cell_width*x);
				rect_element.setAttribute("y", 3*this.cell_width*y);
				rect_element.setAttribute("width", 3*this.cell_width);
				rect_element.setAttribute("height", 3*this.cell_width);
				g_element.appendChild(rect_element);
			}
		}
		svg_grid.appendChild(g_element);
		
		// cursor
		var g_element = document.createElementNS(this.uri, 'g');
		g_element.setAttribute("id", "cursor");
		g_element.setAttribute("fill", "none");
		g_element.setAttribute("stroke", "blue");

		// top left corner
		var polyline_element = document.createElementNS(this.uri, "polyline");
		var points = "0," + (this.cell_width/3) + " " + "0,0 " + (this.cell_width/3) + ",0";
		polyline_element.setAttribute("points", points);
		g_element.appendChild(polyline_element);

		// top right corner
		var polyline_element = document.createElementNS(this.uri, "polyline");
		var points = "" + (2*this.cell_width/3) + ",0 " + (this.cell_width) + ",0 " + (this.cell_width) + "," + (this.cell_width/3);
		polyline_element.setAttribute("points", points);
		g_element.appendChild(polyline_element);

		// bottom right corner
		var polyline_element = document.createElementNS(this.uri, "polyline");
		var points = "" + (2*this.cell_width/3) + "," + (this.cell_width) + " " + (this.cell_width) + "," + (this.cell_width) + " " + (this.cell_width) + "," + (2*this.cell_width/3);
		polyline_element.setAttribute("points", points);
		g_element.appendChild(polyline_element);

		// bottom left corner
		var polyline_element = document.createElementNS(this.uri, "polyline");
		var points = "" + (this.cell_width/3) + "," + (this.cell_width) + " 0," + (this.cell_width) + " 0," + (2*this.cell_width/3);
		polyline_element.setAttribute("points", points);
		g_element.appendChild(polyline_element);

		svg_grid.appendChild(g_element);

		// numbers buttons
		
		var div_element = document.getElementById("numbers");
		for (var i = 0 ; i <= this.max ; i++)
		{
			var button_element = document.createElement("button");
			button_element.innerHTML = i;
			button_element.setAttribute("onclick", "grid.onButtonClick(innerHTML)");
			div_element.appendChild(button_element);
		}
	}

	onCellClick(cell_id) {
		var index_comma = cell_id.indexOf(',');
		var x = 1*cell_id.slice(0,index_comma);
		var y = 1*cell_id.slice(index_comma+1, cell_id.length);
		this.set_cursor_pos(x,y);
	}

	onButtonClick(id) {
		var digit = id*1;
		if (this.selection.length) {
			this.fill_selected(digit)
		}
		else {
			this.fill_cell(this.cursor_pos[0], this.cursor_pos[1], digit);
		}
	}

	onSelectClick() {
		this.add_cell_to_selection(this.cursor_pos[0], this.cursor_pos[1])
	}

	onUnSelectClick() {
		this.remove_cell_from_selection(this.cursor_pos[0], this.cursor_pos[1])
	}

	updateCursorPos() {
		var cursor_element = document.getElementById("cursor");
		cursor_element.setAttribute("transform", "translate(" + (this.cursor_pos[0]-1)*this.cell_width + " " + (this.cursor_pos[1]-1)*this.cell_width + ")" );
	}
}

var grid = new Grid
