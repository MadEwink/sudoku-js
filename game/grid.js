// check if digit in 1..max, useful for cell possible values (for fill, 0 is valid however) and for grid boundaries
function check_digit(digit, max) {
	return !(digit < 1 || digit > max)
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
		// selected cells
		this.selection = new Array()
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
		var cell_width = 10;

		var uri = "http://www.w3.org/2000/svg"

		var svg_grid = document.getElementById("grid");
		var viewbox = "" + (-cell_width) + " " + (-cell_width) + " " + (cell_width*(this.width+2)) + " " + (cell_width*(this.height+2));
		svg_grid.setAttribute("viewBox", viewbox);

		var g_element = document.createElementNS(uri,'g');
		g_element.setAttribute("id","cells");
		g_element.setAttribute("fill", "white");
		g_element.setAttribute("stroke", "black");
		g_element.setAttribute("stroke-width", "0.1");

		for (var y = 1 ; y <= this.height ; y++) {
			for (var x = 1 ; x <= this.width ; x++) {
				var rect_element = document.createElementNS(uri,'rect');
				var id = "" + x + "," + y;
				rect_element.setAttribute("id", id);
				rect_element.setAttribute("onclick", "grid.onCellClick(id)");
				rect_element.setAttribute("x", cell_width*(x-1));
				rect_element.setAttribute("y", cell_width*(y-1));
				rect_element.setAttribute("width", cell_width);
				rect_element.setAttribute("height", cell_width);
				g_element.appendChild(rect_element);
			}
		}
		svg_grid.appendChild(g_element);
		var g_element = document.createElementNS(uri, 'g');
		g_element.setAttribute("fill", "none");
		g_element.setAttribute("stroke", "black");
		g_element.setAttribute("stroke-width", "0.5");
		// 3x3 cells
		for (var x = 0 ; x < (this.width/3) ; x++) {
			for (var y = 0 ; y < (this.height/3) ; y++) {
				var rect_element = document.createElementNS(uri,'rect');
				rect_element.setAttribute("x", 3*cell_width*x);
				rect_element.setAttribute("y", 3*cell_width*y);
				rect_element.setAttribute("width", 3*cell_width);
				rect_element.setAttribute("height", 3*cell_width);
				g_element.appendChild(rect_element);
			}
		}
		svg_grid.appendChild(g_element);
	}

	onCellClick(cell_id) {
		var index_comma = cell_id.indexOf(',');
		var x = cell_id.slice(0,index_comma);
		var y = cell_id.slice(index_comma+1, cell_id.length);
	}
}

var grid = new Grid
