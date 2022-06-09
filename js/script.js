(function() {
    let mode = 1;
    let mouseIsDown = false;
    
    let buttons = document.querySelectorAll('#obstacleMode, #startMode, #goalMode');
    let board = document.querySelector('#board');
    
    window.addEventListener('mousedown', function(e) {
        mouseIsDown = true;
        if (e.target.classList.contains('column')) {
            updateColumn(e.target);
        }
    });

    window.addEventListener('mouseup', function() { mouseIsDown = false; });
    
    function neutralizeColumn(columnElement) {
        let classes = ['obstacle', 'start', 'goal'];

        for (let i = 0; i < classes.length; i++) {
            columnElement.classList.remove(classes[i]);
        }
    }

    function updateObstacle(columnElement) {
        let isObstacle = columnElement.classList.contains('obstacle');
        neutralizeColumn(columnElement);
        if (!isObstacle) {
            columnElement.classList.add('obstacle');
        }
    }
    
    function updateStart(columnElement) {
        neutralizeColumn(columnElement);
        let starts = document.querySelectorAll('.start');
        for (let i = 0; i < starts.length; i++) {
            neutralizeColumn(starts[i]);
        }
        columnElement.classList.add('start');
    }
    
    function updateGoal(columnElement) {
        neutralizeColumn(columnElement);
        let starts = document.querySelectorAll('.goal');
        for (let i = 0; i < starts.length; i++) {
            neutralizeColumn(starts[i]);
        }
        columnElement.classList.add('goal');
    }
    
    function updateColumn(columnElement) {
        if (!mouseIsDown) {
            return;
        }

        switch (mode) {
            case 1:
                updateObstacle(columnElement)
                break;
            case 2:
                updateStart(columnElement)
                break;
            case 3:
                updateGoal(columnElement)
                break;
        }

        astar();
    }
    
    function renderColumn(colnr) {
        let e = document.createElement('div');
        e.classList.add('column');
        e.setAttribute('data-column', colnr);
        e.addEventListener('mouseenter', (e) => updateColumn(e.currentTarget));
        return e;
    }

    function renderRow(rownr) {
        let e = document.createElement('div');
        e.classList.add('row');
        e.setAttribute('data-row', rownr);

        for (let i = 0; i < columns; i++) {
            e.appendChild(renderColumn(i));
        }

        return e;
    }

    function getObstacles() {
        let obstacles = {};

        let oe = document.querySelectorAll('.obstacle');
        for (let i = 0; i < oe.length; i++) {
            let oex = parseInt(oe[i].getAttribute('data-column'));
            let oey = parseInt(oe[i].parentElement.getAttribute('data-row'));
            if (!isNaN(oex) && !isNaN(oey)) {
                obstacles[oey + 'x' + oex] = true;
            }
        }

        return obstacles;
    }

    function getNodeFromPos(row, column) {
        return document.querySelector(`.row[data-row="${row}"] .column[data-column="${column}"]`);
    }
    
    function getNeighbourNodes(pos) {
        return document.querySelectorAll(`
            .row[data-row="${pos.row-1}"] .column[data-column="${pos.column}"],
            
            .row[data-row="${pos.row}"] .column[data-column="${pos.column-1}"],
            .row[data-row="${pos.row}"] .column[data-column="${pos.column+1}"],
            
            .row[data-row="${pos.row+1}"] .column[data-column="${pos.column}"]
        `);
    }

    function getPos(column) {
        return {   
            column: parseInt(column.getAttribute('data-column')),
            row: parseInt(column.parentElement.getAttribute('data-row'))
        }
    }
    
    function indexOfPos(src, row, column) {
        for (let i = 0; i < src.length; i++) {
            if (src[i].row === row && src[i].column === column) {
                return i;
            }
        }
        return -1;
    }

    function calcDistance(pos1, pos2) {
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.column - pos2.column);
    }

    function lowestCostIndex(src) {
        if (src.length === 0) {
            return -1;
        }

        let lowest = 0;
        for (let i = 1; i < src.length; i++) {
            if (src[i].gScore + src[i].hScore < src[lowest].gScore + src[lowest].hScore) {
                lowest = i;
            }
        }
        return lowest;
    }

    function closeColumn(map, row, column, targetRow, targetColumn) {
        map[row + 'x' + column] = {
            targetRow: targetRow,
            targetColumn: targetColumn
        };
    }

    function getColumn(map, row, column) {
        return map[row + 'x' + column];
    }

    function clearPath() {
        let e = document.querySelectorAll('.path');
        for (let i = 0; i < e.length; i++) {
            e[i].classList.remove('path');
        }
    }

    function astarFinalize(closedset, aPos, bPos) {
        let path = [];
        let current = getColumn(closedset, bPos.row, bPos.column);

        while (current.targetRow !== aPos.row || current.targetColumn !== aPos.column) {
            if (!current) {
                return null;
            }

            path.push({
                row: current.targetRow,
                column: current.targetColumn
            });

            current = getColumn(closedset, current.targetRow, current.targetColumn);
        }
        path.reverse();
        return path;
    }

    function addCoordinate(openset, targetPos, fromPos, newPos) {
        let newPosIndexIndex = indexOfPos(openset, newPos.row, newPos.column);
        let data = {
            row: newPos.row,
            column: newPos.column,
            gScore: fromPos.gScore + 1,
            hScore: calcDistance(newPos, targetPos),
            targetRow: fromPos.row,
            targetColumn: fromPos.column
        };
        if (newPosIndexIndex === -1) {
            openset.push(data);
        } else if (openset[newPosIndexIndex].gScore + openset[newPosIndexIndex].hScore > data.gScore + data.hScore) {
            openset[newPosIndexIndex] = data;
        }
    }

    function astarSeek(aPos, bPos) {
        let openset = [{
            row: aPos.row,
            column: aPos.column,
            gScore: 0,
            hScore: calcDistance(aPos, bPos),
            targetRow: null,
            targetColumn: null
        }];

        let closedset = {};

        let obstacles = getObstacles();
        while (true) {
            let lci = lowestCostIndex(openset);

            if (lci === -1) {
                console.log('error');
                return null;
            }

            let closest = openset.splice(lci, 1)[0];
            
            closeColumn(closedset, closest.row, closest.column, closest.targetRow, closest.targetColumn);
            
            if (closest.row == bPos.row && closest.column === bPos.column) {
                console.log('done');
                return astarFinalize(closedset, aPos, bPos);
            }
            
            let neighbours = getNeighbourNodes(closest);

            for (let i = 0; i < neighbours.length; i++) {
                let neighbour = getPos(neighbours[i]);
                if (getColumn(closedset, neighbour.row, neighbour.column)) {
                    console.log('already closed');
                } else if (getColumn(obstacles, neighbour.row, neighbour.column)) {
                    console.log('obstacle found');
                } else {
                    console.log('possible coordinate found');
                    addCoordinate(openset, bPos, closest, neighbour);
                }
            }
        }
    }

    function astar() {
        let pointA = document.querySelector('.start');
        let pointB = document.querySelector('.goal');
        if (pointA === null || pointB === null) {
            return;
        }

        let aPos = getPos(pointA);
        let bPos = getPos(pointB);

        let resp = astarSeek(aPos, bPos);

        clearPath();
        
        if (!resp) {
            return;
        }

        for (let i = 0; i < resp.length; i++) {
            getNodeFromPos(resp[i].row, resp[i].column).classList.add('path');
        }
    }

    function renderBoard() {
        board.innerHTML = '';
        if (rows <= 0 || columns <= 0) {
            return;
        }

        for (let i = 0; i < rows; i++) {
            board.appendChild(renderRow(i));
        }
    }

    function setActive(e) {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('active');
        }
        e.classList.add('active');
    }

    document.querySelector('#obstacleMode').addEventListener('click', function() {
        setActive(this);
        mode = 1;
    });

    document.querySelector('#startMode').addEventListener('click', function() {
        setActive(this);
        mode = 2;
    });

    document.querySelector('#goalMode').addEventListener('click', function() {
        setActive(this);
        mode = 3;
    });

    document.querySelector('#columns').addEventListener('input', function() {
        columns = parseInt(this.value) || 0;
        renderBoard();
    });

    document.querySelector('#rows').addEventListener('input', function() {
        rows = parseInt(this.value) || 0;
        renderBoard();
    });
})();
