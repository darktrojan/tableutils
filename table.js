String.prototype.normalize = function() {
	var str = this.toLowerCase();
	str = str.replace(/[\u00e0-\u00e5]/g, 'a');
	str = str.replace(/\u00e7/g, 'c');
	str = str.replace(/[\u00e8-\u00eb]/g, 'e');
	str = str.replace(/[\u00ec-\u00ef]/g, 'i');
	str = str.replace(/\u00f1/g, 'n');
	str = str.replace(/[\u00f2-\u00f6\u00f8]/g, 'o');
	str = str.replace(/[\u00f9-\u00fc]/g, 'u');
	str = str.replace(/[\u00fd\u00ff]/g, 'y');
	return str;
};

function initTable(table) {
	var tr = table.querySelector('.sortrow');
	tr.onclick = function(event) {
		var th;
		if (event)
			th = event.target;
		else
			th = window.event.srcElement;

		if (!$cnc(th, 'sortable'))
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

	table.sortByColumn = function(colNum, descending) {
		var tr = this.querySelector('.sortrow');
		var th = tr.cells[colNum];

		if (typeof descending == 'undefined') {
			descending = $cnc(th, 'sort-asc');
		}

		for (var i = 0; i < tr.cells.length; i++) {
			$cnr(tr.cells[i], 'sort-asc');
			$cnr(tr.cells[i], 'sort-desc');
		}
		$cna(th, descending ? 'sort-desc' : 'sort-asc');

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
			} else if ('textContent' in a) {
				a = a.textContent.normalize();
				b = b.textContent.normalize();
			} else {
				a = a.innerText.normalize();
				b = b.innerText.normalize();
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

		if (typeof storageKey == 'string' && 'localStorage' in window) {
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

		if (typeof storageKey == 'string' && 'localStorage' in window) {
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

		if (typeof this.onresize == 'function') {
			this.onresize();
		}
	};

	table.showColumns = function(colNums) {
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
			for (var i = 0, iCount = thead.rows.length; i < iCount; i++) {
				thead.rows[i].cells[colNum].style.display = '';
			}
			for (var i = 0, iCount = tbody.rows.length; i < iCount; i++) {
				tbody.rows[i].cells[colNum].style.display = '';
			}
			var index = hiddenColumns.indexOf(colNum);
			if (index >= 0) {
				hiddenColumns.splice(index, 1);
			}
		}

		this.setAttribute('data-hiddencolumns', hiddenColumns.join(','));

		if (typeof storageKey == 'string' && 'localStorage' in window) {
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

		if (typeof this.onresize == 'function') {
			this.onresize();
		}
	};

	table.filter = function(filterString) {
		var rows = table.tBodies[0].rows;
		var words = filterString.trim().normalize().split(/\s+/);
		if (words.length == 1 && words[0] == '') {
			words.pop();
		}
		for (var i = 0; i < rows.length; i++) {
			if (!words.length) {
				$cnr(rows[i], 'filtered');
				continue;
			}
			var cells = rows[i].cells;
			var matches = 0;
			for (var k = 0; k < words.length; k++) {
				var matchesWord = false;
				for (var j = 1; j < cells.length; j++) {
					if (cells[j].style.display != 'none') {
						var content = 'textContent' in cells[j] ? cells[j].textContent.normalize() : cells[j].innerText.normalize();
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
				$cnr(rows[i], 'filtered');
			else
				$cna(rows[i], 'filtered');
		}
	};

	var doSort = true;
	var doHide = true;
	if (typeof storageKey == 'string' && 'localStorage' in window) {
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
			this.value = '';
		}
		if (this._value == this.value) {
			return;
		}
		this._value = this.value;

		table.filter(this.value);
	};
}