String.prototype.normalize = function() {
	return this.toLowerCase()
		.replace(/[\u00e0-\u00e5]/g, 'a')
		.replace(/\u00e7/g, 'c')
		.replace(/[\u00e8-\u00eb]/g, 'e')
		.replace(/[\u00ec-\u00ef]/g, 'i')
		.replace(/\u00f1/g, 'n')
		.replace(/[\u00f2-\u00f6\u00f8]/g, 'o')
		.replace(/[\u00f9-\u00fc]/g, 'u')
		.replace(/[\u00fd\u00ff]/g, 'y')
		.replace(/[\W_]/g, '');
};

function initTable(table) {
	var sortRow = table.querySelector('.sortrow');
	sortRow.onclick = function(event) {
		var th;
		if (event)
			th = event.target;
		else
			th = window.event.srcElement;

		if (!th.classList.contains('sortable'))
			return;

		var colNum;
		for (var i = 0; i < this.cells.length; i++) {
			if (this.cells[i] == th) {
				colNum = i;
				break;
			}
		}
		table.sortByColumn(colNum);
	};

	function setFilter() {
		var group = this.parentNode.parentNode;
		var checkboxes = group.querySelectorAll('input[type="checkbox"]');
		var values = [];
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].checked)
				values.push(checkboxes[i].value);
		}
		table.setColumnFilter(group.colNum, values);
	}

	if (sortRow.querySelector('.filterable')) {
		var filterRow = document.createElement('tr');
		filterRow.classList.add('filterrow');
		for (var i = 0; i < sortRow.cells.length; i++) {
			var td = document.createElement('td');
			filterRow.appendChild(td);
			if (!sortRow.cells[i].classList.contains('filterable'))
				continue;

			td.colNum = i;
			td.vAlign = 'bottom';
			var values = [];
			for (var j = 0; j < table.tBodies[0].rows.length; j++) {
				var value = table.tBodies[0].rows[j].cells[i].textContent;
				if (values.indexOf(value) == -1) {
					values.push(value);
				}
			}
			values = values.sort();
			for (var j = 0; j < values.length; j++) {
				var checkbox = document.createElement('input');
				checkbox.setAttribute('type', 'checkbox');
				checkbox.checked = true;
				checkbox.onclick = setFilter;
				checkbox.value = values[j].normalize();
				var label = document.createElement('label');
				label.appendChild(checkbox);
				if (values[j]) {
					label.appendChild(document.createTextNode('\u00a0' + values[j]));
				} else {
					label.classList.add('novalue');
					label.appendChild(document.createTextNode('\u00a0No value'));
				}
				td.appendChild(label);
			}
		}
		sortRow.parentNode.insertBefore(filterRow, sortRow.nextSibling);
	}

	table.sortByColumn = function(colNum, descending) {
		var th = sortRow.cells[colNum];

		if (!th) {
			return;
		}

		if (typeof descending == 'undefined') {
			descending = th.classList.contains('sort-asc');
		}

		for (var i = 0; i < sortRow.cells.length; i++) {
			sortRow.cells[i].classList.remove('sort-asc');
			sortRow.cells[i].classList.remove('sort-desc');
		}
		th.classList.add(descending ? 'sort-desc' : 'sort-asc');

		this.sortByColumnInternal(colNum, descending);
	};

	table.sortByColumnInternal = function(colNum, descending) {
		var tbody = this.tBodies[0];
		var rows = [];
		for (var i = 0, iCount = tbody.rows.length; i < iCount; i++) {
			rows.push(tbody.rows[i]);
		}

		rows.sort(function(x, y) {
			var a = x.cells[colNum];
			var b = y.cells[colNum];

			if (a.hasAttribute('data-sortable') && b.hasAttribute('data-sortable')) {
				a = a.getAttribute('data-sortable');
				b = b.getAttribute('data-sortable');
			} else {
				a = a.textContent.normalize();
				b = b.textContent.normalize();
			}

			if (/^[0-9,.]+$/.test(a) && /^[0-9,.]+$/.test(b)) {
				var p = parseInt(a.replace(/,/g, ''), 10);
				var q = parseInt(b.replace(/,/g, ''), 10);
				if (p < q)
					return descending ? 1 : -1;
				if (p > q)
					return descending ? -1 : 1;
			}

			if (a < b)
				return descending ? 1 : -1;
			if (a > b)
				return descending ? -1 : 1;
			if (rows.indexOf)
				return rows.indexOf(x) - rows.indexOf(y);
			return 0;
		});

		var removeFrag = document.createDocumentFragment();
		removeFrag.appendChild(tbody);
		var addFrag = document.createDocumentFragment();
		for (var i = 0, iCount = rows.length; i < iCount; i++) {
			addFrag.appendChild(rows[i]);
		}
		tbody.appendChild(addFrag);
		this.appendChild(removeFrag);

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(localStorage.getItem(this.id));
			if (!storageData) {
				storageData = {};
			}
			if (!(storageKey in storageData)) {
				storageData[storageKey] = {};
			}
			storageData[storageKey].sortColumn = colNum;
			storageData[storageKey].sortDirection = descending ? 'desc' : 'asc';
			storageData[storageKey].lastChange = Date.now();
			localStorage.setItem(this.id, JSON.stringify(storageData));
		}
	};

	table.hideColumns = function(colNums) {
		if (colNums.length == 1 && colNums[0] == '') {
			colNums = [];
		}

		var thead = this.tHead;
		var tbody = this.tBodies[0];

		var hiddenColumns;
		var hiddenColumnsAttr = this.getAttribute('data-hiddencolumns');
		if (hiddenColumnsAttr === null || hiddenColumnsAttr === '') {
			hiddenColumns = [];
		} else {
			hiddenColumns = hiddenColumnsAttr.split(',');
			for (var i = 0, iCount = hiddenColumns.length; i < iCount; i++) {
				hiddenColumns[i] = parseInt(hiddenColumns[i]);
			}
		}

		for (var j = 0, jCount = colNums.length; j < jCount; j++) {
			var colNum = parseInt(colNums[j]);

			if (!this.querySelector('.sortrow').cells[colNum]) {
				var index = hiddenColumns.indexOf(colNum);
				if (index >= 0) {
					hiddenColumns.splice(index, 1);
				}
				continue;
			}

			for (var i = 0, iCount = thead.rows.length; i < iCount; i++) {
				thead.rows[i].cells[colNum].style.display = 'none';
			}
			for (var i = 0, iCount = tbody.rows.length; i < iCount; i++) {
				tbody.rows[i].cells[colNum].style.display = 'none';
			}
			if (hiddenColumns.indexOf(colNum) < 0) {
				hiddenColumns.push(colNum);
			}
		}

		this.setAttribute('data-hiddencolumns', hiddenColumns.join(','));

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(localStorage.getItem(this.id));
			if (!storageData) {
				storageData = {};
			}
			if (!(storageKey in storageData)) {
				storageData[storageKey] = {};
			}
			storageData[storageKey].hiddenColumns = hiddenColumns;
			storageData[storageKey].lastChange = Date.now();
			localStorage.setItem(this.id, JSON.stringify(storageData));
		}

		this.filter(this.lastFilterString);

		if (typeof this.onresize == 'function') {
			this.onresize();
		}
	};

	table.showColumns = function(colNums) {
		if (colNums.length == 1 && colNums[0] == '') {
			colNums = [];
		}

		var thead = this.tHead;
		var tbody = this.tBodies[0];

		var hiddenColumns;
		var hiddenColumnsAttr = this.getAttribute('data-hiddencolumns');
		if (hiddenColumnsAttr === null || hiddenColumnsAttr === '') {
			hiddenColumns = [];
		} else {
			hiddenColumns = hiddenColumnsAttr.split(',');
			for (var i = 0, iCount = hiddenColumns.length; i < iCount; i++) {
				hiddenColumns[i] = parseInt(hiddenColumns[i]);
			}
		}

		for (var j = 0, jCount = colNums.length; j < jCount; j++) {
			var colNum = parseInt(colNums[j]);
			var index = hiddenColumns.indexOf(colNum);
			if (index >= 0) {
				hiddenColumns.splice(index, 1);
			}

			if (!this.querySelector('.sortrow').cells[colNum]) {
				continue;
			}

			for (var i = 0, iCount = thead.rows.length; i < iCount; i++) {
				thead.rows[i].cells[colNum].style.display = '';
			}
			for (var i = 0, iCount = tbody.rows.length; i < iCount; i++) {
				tbody.rows[i].cells[colNum].style.display = '';
			}
		}

		this.setAttribute('data-hiddencolumns', hiddenColumns.join(','));

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(localStorage.getItem(this.id));
			if (!storageData) {
				storageData = {};
			}
			if (!(storageKey in storageData)) {
				storageData[storageKey] = {};
			}
			storageData[storageKey].hiddenColumns = hiddenColumns;
			storageData[storageKey].lastChange = Date.now();
			localStorage.setItem(this.id, JSON.stringify(storageData));
		}

		this.filter(this.lastFilterString);

		if (typeof this.onresize == 'function') {
			this.onresize();
		}
	};

	table.lastFilterString = '';
	table.columnFilters = {};

	table.filter = function(filterString) {
		table.lastFilterString = filterString;
		var rows = table.tBodies[0].rows;
		var words = filterString.trim().normalize().split(/\s+/);
		if (words.length == 1 && words[0] == '') {
			words.pop();
		}
		for (var i = 0; i < rows.length; i++) {
			if (!table.matchesColumnFilters(rows[i])) {
				rows[i].classList.add('filtered');
				continue;
			}

			if (!words.length) {
				rows[i].classList.remove('filtered');
				continue;
			}
			var cells = rows[i].cells;
			var matches = 0;
			for (var k = 0; k < words.length; k++) {
				var matchesWord = false;
				for (var j = 0; j < cells.length; j++) {
					if (cells[j].style.display != 'none') {
						var content = cells[j].textContent.normalize();
						if (content.indexOf(words[k]) >= 0) {
							matchesWord = true;
							break;
						}
					}
				}
				if (matchesWord)
					matches++;
				else
					break;
			}
			if (matches == words.length)
				rows[i].classList.remove('filtered');
			else
				rows[i].classList.add('filtered');
		}
	};

	table.setColumnFilter = function(colNum, value) {
		if (value === null) {
			delete table.columnFilters[colNum];
		} else if (typeof value == 'string') {
			table.columnFilters[colNum] = value.normalize();
		} else {
			var normalFilters = [];
			for (var i = 0; i < value.length; i++) {
				normalFilters.push(value[i].normalize());
			}
			table.columnFilters[colNum] = normalFilters;
		}

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(localStorage.getItem(this.id));
			if (!storageData) {
				storageData = {};
			}
			if (!(storageKey in storageData)) {
				storageData[storageKey] = {};
			}
			storageData[storageKey].columnFilters = table.columnFilters;
			storageData[storageKey].lastChange = Date.now();
			localStorage.setItem(this.id, JSON.stringify(storageData));
		}

		table.filter(table.lastFilterString);
	};

	table.matchesColumnFilters = function(row) {
		var cells = row.cells;
		for (var colNum in table.columnFilters) {
			var filter = table.columnFilters[colNum];
			var value = cells[colNum].textContent.normalize();
			if (typeof filter == 'string') {
				if (value != filter) {
					return false;
				}
			} else if (filter.indexOf(value) == -1) {
				return false;
			}
		}
		return true;
	};

	var doSort = true;
	var doHide = true;
	if (typeof storageKey == 'string') {
		var storageData = JSON.parse(localStorage.getItem(table.id));
		if (storageData && storageKey in storageData) {
			var data = storageData[storageKey];
			if ('sortColumn' in data && 'sortDirection' in data) {
				table.sortByColumn(data.sortColumn, data.sortDirection == 'desc');
				doSort = false;
			}
			if ('hiddenColumns' in data) {
				table.setAttribute('data-hiddencolumns', '');
				table.hideColumns(data.hiddenColumns);
				doHide = false;
			}
			if ('columnFilters' in data) {
				table.columnFilters = data.columnFilters;
				for (var colNum in table.columnFilters) {
					var filters = table.columnFilters[colNum];
					var checkboxes = filterRow.cells[colNum].querySelectorAll('input[type="checkbox"]');
					for (var i = 0; i < checkboxes.length; i++) {
						checkboxes[i].checked = filters.indexOf(checkboxes[i].value) >= 0;
					}
				}
				table.filter(table.lastFilterString);
			}
		}
	}

	if (doSort) {
		var sortColumnAttr = table.getAttribute('data-sortcolumn');
		var sortDirectionAttr = table.getAttribute('data-sortdirection');
		if (sortColumnAttr !== null && sortDirectionAttr !== null) {
			table.sortByColumn(sortColumnAttr, sortDirectionAttr == 'desc');
		}
	}
	if (doHide) {
		var hiddenColumnsAttr = table.getAttribute('data-hiddencolumns');
		if (hiddenColumnsAttr !== null) {
			table.hideColumns(hiddenColumnsAttr.split(','));
		}
	}
}

function initList(list, table) {
	function listClick() {
		var colNums = this.getAttribute('data-columns').split(',');
		if (this.checked) {
			table.showColumns(colNums);
		} else {
			table.hideColumns(colNums);
		}
	}

	var checkboxes = list.getElementsByTagName('input');
	for (var i = 0; i < checkboxes.length; i++) {
		var checkbox = checkboxes[i];
		var colNum = checkbox.getAttribute('data-columns').split(',')[0];
		checkbox.checked = table.tHead.rows[0].cells[colNum].style.display != 'none';
		checkbox.onclick = listClick;
	}
}

function initSelect(select, table) {
	var options = select.options;
	for (var i = 0; i < options.length; i++) {
		var option = options[i];
		var colNum = option.value.split(',')[0];
		option.selected = table.tHead.rows[0].cells[colNum].style.display != 'none';
	}

	select.onchange = function() {
		var options = this.options;
		var show = [];
		var hide = [];
		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			var colNums = option.value.split(',');
			for (var j = 0; j < colNums.length; j++) {
				(option.selected ? show : hide).push(colNums[j]);
			}
		}
		table.hideColumns(hide);
		table.showColumns(show);
	};
}

function initFilter(input, table) {
	input.onkeyup = function(event) {
		if (!event) {
			event = window.event;
		}
		if (event.keyCode == 27) {
			this.clearFilter();
			return;
		}
		if (this._value == this.value) {
			return;
		}
		this._value = this.value;

		table.filter(this.value);

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(sessionStorage.getItem(this.id));
			if (!storageData) {
				storageData = {};
			}
			if (!(storageKey in storageData)) {
				storageData[storageKey] = {};
			}
			storageData[storageKey].filter = this.value;
			sessionStorage.setItem(table.id, JSON.stringify(storageData));
		}
	};

	input.clearFilter = function() {
		input.value = input._value = '';
		table.filter('');

		if (typeof storageKey == 'string') {
			var storageData = JSON.parse(sessionStorage.getItem(table.id));
			if (storageData && storageKey in storageData) {
				delete storageData[storageKey].filter;
				sessionStorage.setItem(table.id, JSON.stringify(storageData));
			}
		}
	};

	if (typeof storageKey == 'string') {
		var storageData = JSON.parse(sessionStorage.getItem(table.id));
		if (storageData && storageKey in storageData) {
			var data = storageData[storageKey];
			if ('filter' in data) {
				input.value = input._value = data.filter;
				table.filter(data.filter);
			}
		}
	}
}
