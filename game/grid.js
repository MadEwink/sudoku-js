// check if digit in 1..9, useful for cell possible values (for fill, 0 is valid however) and for grid boundaries
function check_digit(digit) {
	return !(digit < 1 || digit > 9)
}

class Cell {
	constructor() {
		this.value = 0 // empty
		this.corner_indicators = new Array(9)
		this.center_indicators = new Array(9)
		this.color = "white"
		this.is_editable = true
		for (var digit = 1 ; digit <= 9 ; digit++) {
			this.corner_indicators[digit-1] = false
			this.center_indicators[digit-1] = false
		}
	}
	toggle_corner(digit) {
		if (!(this.is_editable && check_digit(digit)))
			return
		this.corner_indicators[digit-1] = !this.corner_indicators[digit-1]
	}
	toggle_center(digit) {
		if (!( this.is_editable && check_digit(digit)))
			return
		this.center_indicators[digit-1] = !this.center_indicators[digit-1]
	}
	fill(digit) {
		if (!this.is_editable || digit > 9 || digit < 0)
			return
		this.value = digit
	}
	erase() {
		if (!this.is_editable)
			return
		this.value = 0
		for (var digit = 1 ; digit <= 9 ; digit++) {
			this.corner_indicators[digit-1] = false
			this.center_indicators[digit-1] = false
		}
	}
}

class Grid {

	constructor(width=9, height=9) {
		this.width = width
		this.height = height
		// cells array
		this.cells = new Array(width)
		for (var x = 0 ; x < width ; x++)
		{
			this.cells[x] = new Array(height)
			for (var y = 0 ; y < height ; y++)
			{
				this.cells[x][y] = new Cell
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
		if (!(check_digit(x) && check_digit(y)))
			return
		this.cells[x-1][y-1].fill(digit)
	}
	erase_cell(x,y) {
		if (!(check_digit(x) && check_digit(y)))
			return
		this.cells[x-1][y-1].erase()
	}
	toggle_cell_corner(x,y,digit) {
		if (!(check_digit(x) && check_digit(y)))
			return
		this.cells[x-1][y-1].toggle_corner(digit)
	}
	toggle_cell_center(x,y,digit) {
		if (!(check_digit(x) && check_digit(y)))
			return
		this.cells[x-1][y-1].toggle_center(digit)
	}

	/*===========================
	 * Selection related actions
	 *===========================
	 */

	/*============================
	 * Whole grid related actions
	 *============================
	 */

	// validate the solution according to classic sudoku rules
	classic_validate() {
		// check each column
		for (var x = 0 ; x < this.width ; x++)
		{
			var found_digits = [false, false, false, false, false, false, false, false, false]
			for (var y = 0 ; y < this.height ; y++)
			{
				var digit = this.cells[x][y].value
				// if incorrect number
				if (!check_digit(digit))
					return false
				// if two of the same in the column
				if (found_digits[digit-1])
					return false
				found_digits[digit-1] = true
			}
			for (var b in found_digits) {
				if (!b)
					return false
			}
		}
		// check each row
		for (var y = 0 ; y < this.height ; y++)
		{
			var found_digits = [false, false, false, false, false, false, false, false, false]
			for (var x = 0 ; x < this.width ; x++)
			{
				var digit = this.cells[x][y].value
				// if incorrect number
				if (!check_digit(digit))
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
		// hardcoded nine :/
		// TODO : think about it
		for (var i = 0 ; i < 9 ; i++)
		{
			var found_digits = [false, false, false, false, false, false, false, false, false]
			for (var x = 3*(i%3) ; x < 3*((i%3)+1) ; x++)
			{
				for (var y = 3*Math.floor(i/3) ; y < 3*(Math.floor((i+1)/3)) ; y++)
				{
					var digit = this.cells[x][y].value
					// if incorrect number
					if (!check_digit(digit))
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
}
