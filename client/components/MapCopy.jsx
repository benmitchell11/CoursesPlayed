import React, { useEffect, useRef, useState } from 'react'
import { getRegion } from '../apiClient'

export default function MapCopy () {

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
            width: 1000,
            height: 1982
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
        e.preventDefault()
        if (e.deltaY) {
            const sign = Math.sign(e.deltaY) / 10
            const scale = 1 - sign
            const rect = containerRef.current.getBoundingClientRect()

            console.log(map)

            setPosition({
                ...position,
                x: position.x * scale - (rect.width / 2 - e.clientX + rect.x) * sign,
                y: position.y * scale - (1982 * rect.width / 1000 / 2 - e.clientY + rect.y) * sign,
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
        window.addEventListener('onWheel', onWheel, {passive:false})

        return () => {
            window.removeEventListener('mouseup', mouseup)
            window.removeEventListener('mousemove', mousemove)
             
        }
    })

  

    
    
    return (

       
    
        <div className='viewBox'>
        <div
      className="PanAndZoomImage-container"
      ref={containerRef}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
    >
       


        
</div>
</div>

    )
}