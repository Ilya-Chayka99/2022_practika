window.addEventListener('load',function (){
    const canvas = document.querySelector("#canvas1")
    const ctx = canvas.getContext('2d')
    canvas.width=500
    canvas.height=500


    class Game
    {
        constructor(width,height) {
            this.width= width
            this.heigth=height
            this.player=new Player(this)
            this.input=new InputHandler()
        }
        update()
        {
            this.player.update(this.input.keys)
        }
        draw(context)
        {
            this.player.draw(context)
        }
    }

    class Player
    {
        constructor(game)
        {
            this.game=game
            this.width=100
            this.height=91.3
            this.x=0
            this.y=this.game.heigth - this.height
            this.image = document.querySelector('#player')
            this.speed = 0
            this.maxSpeed=10
            this.vy=0
            this.wait=0.5
            // this.image = player
        }
        update(input)
        {
            //horizontal
            this.x+=this.speed
            if(input.includes('ArrowRight'))
            {
                this.speed = this.maxSpeed
            }
            else if(input.includes('ArrowLeft'))
            {
                this.speed = -this.maxSpeed
            }
            else this.speed=0
            if(this.x<0) this.x=0
            if(this.x>this.game.width-this.width) this.x=this.game.width-this.width
            //vertical
            if(input.includes('ArrowUp') && this.onGround()) this.vy-=20
            this.y+=this.vy
            if(!this.onGround()) this.vy+=this.wait
            else this.vy=0

        }
        draw(context)
        {
            context.drawImage(this.image,0,0,this.width,this.height,this.x,this.y,this.width,this.height)

        }
        onGround()
        {
            return this.y>=this.game.heigth - this.height
        }
    }
    class InputHandler
    {
        constructor()
        {
            this.keys=[]
            window.addEventListener('keydown',e=>{
                if((e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control') && this.keys.indexOf(e.key) === -1)
                {
                    this.keys.push(e.key)
                }
                // console.log(e.key,this.keys)
            })

            window.addEventListener('keyup',e=>{
                if(e.key === 'ArrowDown' || e.key === 'ArrowUp'  || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Control')
                {
                    this.keys.splice(this.keys.indexOf(e.key),1)
                }

            })
        }
    }


    const game = new Game(canvas.width,canvas.height)
    console.log(game)
    function animate()
    {
        ctx.clearRect(0,0,canvas.width,canvas.height)
        game.update()
        game.draw(ctx)
        requestAnimationFrame(animate)
    }
    animate()
})
