/**
 * Adds a grid to an SVG element with customizable options for color, size, and labels.
 *
 * @param {SVGSVGElement} svg - The SVG element to which the grid will be added.
 * @param {Object} opts - Options for customizing the grid.
 * @param {string} [opts.color='#00F'] - Color of the grid lines.
 * @param {number} [opts.size=100] - Size of the grid cells.
 * @param {boolean} [opts.labels=true] - Whether to add labels to the grid lines.
 */
export function addGridToSvg(
    svg: SVGSVGElement,
    opts = {} as {
        color?: string,
        size?: number,
        labels?: boolean
    }
) {
    const { color = '#00F', size = 100, labels = true } = opts

    // Get the viewBox attribute of the SVG and parse it into x, y, width, and height
    const [x, y, w, h] = svg
        .getAttribute('viewBox')!
        .split(' ')
        .map((v) => +v)

    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    grid.setAttribute('transform', `translate(${x}, ${y})`)
    grid.setAttribute('id', 'grid')
    grid.setAttribute('stroke', color)
    grid.setAttribute('stroke-width', '1')

    if (labels) {
        grid.setAttribute('font', '10px/10px normal Serif')
        grid.setAttribute('fill', color)
        grid.setAttribute('text-anchor', 'middle')
    }

    // Add vertical lines to the grid
    for (let i = 0; i < Math.ceil(w / size); i++) {
        if (i > 0) {
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            verticalLine.setAttribute('x1', `${i * size}`)
            verticalLine.setAttribute('y1', '0')
            verticalLine.setAttribute('x2', `${i * size}`)
            verticalLine.setAttribute('y2', `${h}`)
            grid.appendChild(verticalLine)
        }

        if (labels) {
            const colLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            colLabel.setAttribute('x', `${i * 100 + 50}`)
            colLabel.setAttribute('y', '16')
            colLabel.textContent = String.fromCharCode(97 + i).toUpperCase()
            grid.appendChild(colLabel)
        }
    }

    // Add horizontal lines to the grid
    for (let i = 0; i < Math.ceil(h / size); i++) {
        const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        horizontalLine.setAttribute('x1', '0')
        horizontalLine.setAttribute('y1', `${i * size}`)
        horizontalLine.setAttribute('x2', `${w}`)
        horizontalLine.setAttribute('y2', `${i * size}`)
        grid.appendChild(horizontalLine)

        if (labels) {
            const rowLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            rowLabel.setAttribute('x', '12')
            rowLabel.setAttribute('y', `${i * 100 + 50}`)
            rowLabel.textContent = `${i}`
            grid.appendChild(rowLabel)
        }
    }

    // Append the grid group to the SVG element
    svg.appendChild(grid)
}
