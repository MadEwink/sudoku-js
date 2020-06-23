// check if digit in 1..max, useful for cell possible values (for fill, 0 is valid however) and for grid boundaries
function check_digit(digit, max) {
	return !(digit < 1 || digit > max)
}

// Cell class : any cell of the grid
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

// Grid class : the grid, handling quite all the game, buttons generation, game logic, game display ; singleton pattern
class Grid {

	constructor(width=9, height=9, max=9) {
		if (Grid.instance)
			return Grid.instance;
		Grid.instance = this;
		this.max = max
		this.width = width
		this.height = height
		// cells array
		this.cells = new Array(width)
		for (var x = 0 ; x < width ; x++) {
			this.cells[x] = new Array(height)
			for (var y = 0 ; y < height ; y++) {
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
		// input related
		this.current_fill_mode = "fill"; // fill | corner | center
		this.temporary_corner = false;
		this.temporary_center = false;
		// load grid content from file

		var regex = new RegExp("[?&]id="+"([^&#]*)|&|#|$");
		var id = regex.exec(window.location.href);
		if (!id) return;
		if (!id[1]) return;
		this.loadGridFromFile(id[1]);
	}

	/*=====================
	 * Single cell actions
	 *=====================
	 */

	// fill the cell in x,y (where 1,1 is top left and 9,9 is down right) with digit
	fill_cell(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return;
		this.cells[x-1][y-1].fill(digit)
		this.updateCell(x,y);
	}
	set_editable(x,y,editable) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return;
		this.cells[x-1][y-1].is_editable = editable;
	}
	erase_cell(x,y) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return;
		this.cells[x-1][y-1].erase()
		this.updateCell(x,y);
	}
	toggle_cell_corner(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return;
		this.cells[x-1][y-1].toggle_corner(digit)
		this.updateCell(x,y);
	}
	toggle_cell_center(x,y,digit) {
		if (!(check_digit(x,this.max) && check_digit(y,this.max)))
			return;
		this.cells[x-1][y-1].toggle_center(digit)
		this.updateCell(x,y);
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
				return;
		}
		this.selection.push([x,y])
		this.updateCellSelected(x,y,true);
	}
	remove_cell_from_selection(x,y) {
		for (var i = 0 ; i < this.selection.length ; i++) {
			if (this.selection[i][0] == x && this.selection[i][1] == y) {
				this.selection.splice(i,1);
				this.updateCellSelected(x,y,false);
				return true;
			}
		}
		return false;
	}
	toggle_cell_selection(x,y) {
		if (!this.remove_cell_from_selection(x,y))
			this.add_cell_to_selection(x,y);
	}
	empty_selection() {
		for (var i = 0 ; i < this.selection.length ; i++)
			this.updateCellSelected(this.selection[i][0],this.selection[i][1],false);
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
		for (var x = 0 ; x < this.width ; x++) {
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var y = 0 ; y < this.height ; y++) {
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
		for (var y = 0 ; y < this.height ; y++) {
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var x = 0 ; x < this.width ; x++) {
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
		for (var i = 0 ; i < (this.width/3)*(this.height/3) ; i++) {
			var found_digits = new Array(this.max)
			for (var i = 0 ; i < this.max ; i++)
				found_digits[i] = false;
			for (var x = 3*(i%3) ; x < 3*((i%3)+1) ; x++) {
				for (var y = 3*Math.floor(i/3) ; y < 3*(Math.floor((i+1)/3)) ; y++) {
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
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

		// thick lines

		var g_element = document.createElementNS(this.uri, 'g');
		g_element.setAttribute("fill", "white");
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

		// Numbers

		var g_element = document.createElementNS(this.uri, 'g');
		g_element.setAttribute("id", "numbers");
		g_element.setAttribute("fill", "black");

		var g_fill = document.createElementNS(this.uri, 'g');
		g_fill.setAttribute("id", "fill");
		var g_corner = document.createElementNS(this.uri, 'g');
		g_corner.setAttribute("id", "corner");
		var g_center = document.createElementNS(this.uri, 'g');
		g_center.setAttribute("id", "center");

		for (var x = 1 ; x <= this.max ; x++) {
			for (var y = 1 ; y <= this.max ; y++) {
				var text = document.createElementNS(this.uri, "text");
				text.id = "fill" + x + "," + y;
				text.setAttribute("x", this.cell_width*(x-1)+2);
				text.setAttribute("y", this.cell_width*(y)-1);
				text.setAttribute("style","font-size : 10px;");
				g_fill.appendChild(text);
				var text = document.createElementNS(this.uri, "text");
				text.id = "corner" + x + "," + y;
				text.setAttribute("x", this.cell_width*(x-1)+1);
				text.setAttribute("y", this.cell_width*(y)-7);
				text.setAttribute("textLength", 8);
				text.setAttribute("style","font-size : 3px;");
				g_corner.appendChild(text);
				var text = document.createElementNS(this.uri, "text");
				text.id = "center" + x + "," + y;
				text.setAttribute("x", this.cell_width*(x-1)+4);
				text.setAttribute("y", this.cell_width*(y)-4);
				text.setAttribute("style","font-size : 3px;");
				g_center.appendChild(text);
			}
		}

		g_element.appendChild(g_fill);
		g_element.appendChild(g_corner);
		g_element.appendChild(g_center);

		svg_grid.appendChild(g_element);

		// selectable cells

		var g_element = document.createElementNS(this.uri,'g');
		g_element.setAttribute("id","cells");
		g_element.setAttribute("fill", "#FFFFFF00");
		g_element.setAttribute("stroke", "black");
		g_element.setAttribute("stroke-width", "0.1");

		for (var y = 1 ; y <= this.height ; y++) {
			for (var x = 1 ; x <= this.width ; x++) {
				var rect_element = document.createElementNS(this.uri,'rect');
				var id = "" + x + "," + y;
				rect_element.setAttribute("id", id);
				rect_element.setAttribute("onclick", "Grid.instance.onCellClick(id)");
				rect_element.setAttribute("x", this.cell_width*(x-1));
				rect_element.setAttribute("y", this.cell_width*(y-1));
				rect_element.setAttribute("width", this.cell_width);
				rect_element.setAttribute("height", this.cell_width);
				g_element.appendChild(rect_element);
			}
		}
		svg_grid.appendChild(g_element);

		this.generate_buttons();
	}

	generate_buttons() {
		// numbers buttons

		var div_element = document.getElementById("numbers-buttons");
		for (var i = 0 ; i <= this.max ; i++) {
			var button_element = document.createElement("button");
			button_element.innerHTML = i;
			button_element.setAttribute("onclick", "Grid.instance.onButtonNumberPress(innerHTML)");
			div_element.appendChild(button_element);
		}

		// load buttons
		
		this.loadGridList();

		var div_element = document.getElementById("load-buttons");
		var button_element = document.createElement("button");
		button_element.innerHTML = "Random preset grid";
		button_element.setAttribute("onclick", "Grid.instance.onButtonRandomPreset()");
		div_element.appendChild(button_element);
		var select_element = document.createElement("select");
		select_element.setAttribute("id", "grid-preset");
		for (var i = 0 ; i < this.grids_infos.length ; i++) {
			var option_element = document.createElement("option");
			option_element.setAttribute("value", this.grids_infos[i][1]);
			option_element.innerHTML = this.grids_infos[i][0];
			select_element.appendChild(option_element);
		}
		div_element.appendChild(select_element);
		var button_element = document.createElement("button");
		button_element.innerHTML = "Load Selected";
		button_element.setAttribute("onclick", "Grid.instance.onButtonLoadPreset()");
		div_element.appendChild(button_element);
	}

	onCellClick(cell_id) {
		var index_comma = cell_id.indexOf(',');
		var x = 1*cell_id.slice(0,index_comma);
		var y = 1*cell_id.slice(index_comma+1, cell_id.length);
		this.set_cursor_pos(x,y);
	}

	onButtonNumberPress(id) {
		var digit = id*1;
		if (this.selection.length) {
			if (this.current_fill_mode == "corner" || this.temporary_corner)
				this.toggle_corner_selected(digit);
			else if (this.current_fill_mode == "center" || this.temporary_center)
				this.toggle_center_selected(digit);
			else
				this.fill_selected(digit)
		}
		else {
			if (this.current_fill_mode == "corner" || this.temporary_corner)
				this.toggle_cell_corner(this.cursor_pos[0], this.cursor_pos[1], digit);
			else if (this.current_fill_mode == "center" || this.temporary_center)
				this.toggle_cell_center(this.cursor_pos[0], this.cursor_pos[1], digit);
			else
				this.fill_cell(this.cursor_pos[0], this.cursor_pos[1], digit);
		}
	}

	onButtonSwitchMode() {
		switch (this.current_fill_mode) {
			case "fill":
				this.current_fill_mode = "corner";
				break;
			case "corner":
				this.current_fill_mode = "center";
				break;
			case "center":
			default:
				this.current_fill_mode = "fill";
				break;
		}
	}

	onButtonSelect() {
		this.add_cell_to_selection(this.cursor_pos[0], this.cursor_pos[1])
	}

	onButtonUnselect() {
		this.remove_cell_from_selection(this.cursor_pos[0], this.cursor_pos[1])
	}
	
	onButtonEmptySelection() {
		this.empty_selection();
	}

	onButtonToggleSelect() {
		this.toggle_cell_selection(this.cursor_pos[0], this.cursor_pos[1]);
	}

	onButtonRandomPreset() {
		var i = Math.floor(Math.random() * this.grids_infos.length);
		this.openPresetPage(i);
	}

	onButtonLoadPreset() {
		var select_element = document.getElementById("grid-preset");
		for (var i = 0 ; i < this.grids_infos.length ; i++) {
			if (select_element.children[i].selected) {
				this.openPresetPage(i);
				return;
			}
		}
	}

	updateCursorPos() {
		var cursor_element = document.getElementById("cursor");
		cursor_element.setAttribute("transform", "translate(" + (this.cursor_pos[0]-1)*this.cell_width + " " + (this.cursor_pos[1]-1)*this.cell_width + ")" );
	}

	updateCell(x,y) {
		if (!(check_digit(x) && check_digit(y)))
			return
		var cell_info = this.cells[x-1][y-1];
		var id = "" + x + "," + y;
		var fill_element = document.getElementById("fill"+id);
		var corner_element = document.getElementById("corner"+id);
		var center_element = document.getElementById("center"+id);
		corner_element.innerHTML = "";
		center_element.innerHTML = "";
		if (cell_info.value != 0) {
			fill_element.innerHTML = cell_info.value;
		}
		else {
			fill_element.innerHTML = "";
			for (var i = 0 ; i < cell_info.corner_indicators.length ; i++) {
				if (cell_info.corner_indicators[i]) {
					corner_element.innerHTML += (i+1);
				}
			}
			var dx = 1;
			for (var i = 0 ; i < cell_info.center_indicators.length ; i++) {
				if (cell_info.center_indicators[i]) {
					center_element.innerHTML += (i+1);
					dx --;
				}
				center_element.setAttribute("dx",dx);
			}
		}
	}

	updateCellSelected(x,y,selected) {
		if (!(check_digit(x) && check_digit(y)))
			return
		var id = "" + x + "," + y;
		var cell_element = document.getElementById(id);
		cell_element.setAttribute("fill",selected ? "#FFFF0088" : "#FFFFFF00");
	}

	/*===========
	 * Load game
	 *===========
	 */

	loadGridFromFile(file) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "./grid_files/" + file + ".xml");
		xhr.responseType = "document";
		xhr.overrideMimeType("text/xml");
		xhr.onload = function () {
			if(xhr.readyState === xhr.DONE && xhr.status == 200) {
				var xml = xhr.responseXML;
				var xml_grid = xml.children[0];
				for (var i = 0 ; i < xml_grid.children.length ; i++) {
					var current_element = xml_grid.children[i];
					if (current_element.nodeName == "cell") {
						var x = current_element.attributes.x.value;
						var y = current_element.attributes.y.value;
						var value = 1*current_element.textContent;
						Grid.instance.fill_cell(x,y,value);
						Grid.instance.set_editable(x,y,false);
					}
				}
			}
		}
		xhr.send();
	}

	loadGridList() {
		this.grids_infos = new Array();
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "./grid_files/list.xml", false);
		xhr.overrideMimeType("text/xml");
		xhr.onload = function () {
			if(xhr.readyState === xhr.DONE && xhr.status == 200) {
				var xml = xhr.responseXML;
				var grid_list = xml.children[0];
				for (var i = 0 ; i < grid_list.children.length ; i++) {
					var current_element = grid_list.children[i];
					var title = current_element.children[0].innerHTML;
					var file = current_element.children[1].innerHTML;
					var description = current_element.children[2].innerHTML;
					Grid.instance.grids_infos.push([title,file,description]);
				}
			}
		}
		xhr.send();
	}

	openPresetPage(i) {
		window.open("./?id="+this.grids_infos[i][1], "_self");
	}
}

function onKeyUp(event_key) {
	switch (event_key.key) {
		case " ":
			event_key.preventDefault();
			return;
		case "Shift":
			Grid.instance.temporary_corner = false;
			return;
		case "Control":
			Grid.instance.temporary_center = false;
			return;
		default:
			break;
	}
}

function onKeyDown(event_key) {
	switch (event_key.key) {
		case "ArrowRight":
			Grid.instance.increment_cursor_x();
			event_key.preventDefault();
			return;
		case "ArrowLeft":
			Grid.instance.decrement_cursor_x();
			event_key.preventDefault();
			return;
		case "ArrowDown":
			Grid.instance.increment_cursor_y();
			event_key.preventDefault();
			return;
		case "ArrowUp":
			Grid.instance.decrement_cursor_y();
			event_key.preventDefault();
			return;
		case " ":
			event_key.preventDefault();
			Grid.instance.onButtonToggleSelect();
			return;
		case "Shift":
			Grid.instance.temporary_corner = true;
			return;
		case "Control":
			Grid.instance.temporary_center = true;
			return;
		case "Tab":
			Grid.instance.onButtonSwitchMode();
		default:
			break;
	}
	for (var i = 48 ; i <= 57 ; i++) {
		if (event_key.keyCode == i) {
			Grid.instance.onButtonNumberPress(i-48);
			event_key.preventDefault();
			return;
		}
	}
	// TODO : handle letters if max over 9
	for (var i = 0 ; i <= Grid.instance.max ; i++) {
		if (event_key.key == i) {
			Grid.instance.onButtonNumberPress(i);
			event_key.preventDefault();
			return;
		}
	}
}

var grid = new Grid
