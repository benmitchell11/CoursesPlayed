import React, { useEffect, useRef, useState } from 'react'

export default function PanTest () {

    const [isPanning, setPanning] = useState(false)
    const [map, setMap] = useState()
    const [position, setPosition] = useState({
        oldX: 0,
        oldY: 0,
        x: 0,
        y: 0,
        z: 1,
    })

    const containerRef = useRef()

    const onLoad = (e) => {
        setMap({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        })
    }

    const onMouseDown = (e) => {
        e.preventDefault()
        setPanning(true)
        setPosition({
            ...position,
            oldX: e.clientX,
            oldY: e.clientY
        })
    }

    const onWheel = (e) => {
        if (e.deltaY) {
            const sign = Math.sign(e.deltaY) / 10
            const scale = 1 - sign
            const rect = containerRef.current.getBoundingClientRect()

            console.log(map)

            setPosition({
                ...position,
                x: position.x * scale - (rect.width / 2 - e.clientX + rect.x) * sign,
                y: position.y * scale - (map.height * rect.width / map.width / 2 - e.clientY + rect.y) * sign,
                z: position.z * scale,
                
            })

            
            
        }
    }

    useEffect(() => {
        const mouseup = () => {
            setPanning(false)
        }

        const mousemove = (event) => {
            if (isPanning) {
                setPosition({
                    ...position,
                    x: position.x + event.clientX - position.oldX,
                    y: position.y + event.clientY - position.oldY,
                    oldX: event.clientX,
                    oldY: event.clientY
                })
            }
        }

        window.addEventListener('mouseup', mouseup)
        window.addEventListener('mousemove', mousemove)

        return () => {
            window.removeEventListener('mouseup', mouseup)
            window.removeEventListener('mousemove', mousemove)
        }
    })

    
    
    return (

        <div
      className="PanAndZoomImage-container"
      ref={containerRef}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
    >
        <div style={{
        transform: `translate(${position.x}px, ${position.y}px) scale(${position.z})`}} >
        <img className='tt' alt='gg' src='./img/background.jpg' onLoad={onLoad} />
        
        
</div>
</div>

    )
}