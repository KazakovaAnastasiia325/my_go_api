 package main

import (
	"github.com/gorilla/websocket"
	"net/http"
	
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	clients   map[*websocket.Conn]bool
	Broadcast chan []byte
}
func (h *Hub) BroadcastChan() chan []byte {
    return h.Broadcast
}
func NewHub() *Hub {
	return &Hub{
		clients:   make(map[*websocket.Conn]bool),
		Broadcast: make(chan []byte),
	}
}

func (h *Hub) Run() {
	for {
		message := <-h.Broadcast
		for client := range h.clients {
			err := client.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				client.Close()
				delete(h.clients, client)
			}
		}
	}
}

func (h *Hub) HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, _ := upgrader.Upgrade(w, r, nil)
	defer ws.Close()
	h.clients[ws] = true
	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(h.clients, ws)
			break
		}
	}
}