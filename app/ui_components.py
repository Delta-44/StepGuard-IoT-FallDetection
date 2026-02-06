import customtkinter as ctk
import config


class DeviceCard(ctk.CTkFrame):
    def __init__(self, master, mac, alias, rename_cb):
        super().__init__(
            master,
            width=config.CARD_SIZE,
            height=config.CARD_SIZE,
            fg_color=config.COLOR_BG_CARD,
            corner_radius=15
        )
        self.grid_propagate(False)
        self.mac = mac
        self.rename_cb = rename_cb

        self.inner_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.inner_frame.pack(expand=True)

        # Nombre o MAC clicable
        self.lbl_name = ctk.CTkLabel(
            self.inner_frame,
            text=alias if alias else mac,
            font=("Roboto", 14, "bold"),
            text_color="#3498DB",
            cursor="hand2"
        )
        self.lbl_name.pack(pady=(0, 5))
        self.lbl_name.bind("<Button-1>", lambda e: self.rename_cb(self.mac))

        # MAC pequeña de referencia
        self.lbl_mac = ctk.CTkLabel(
            self.inner_frame,
            text=mac,
            font=("Roboto", 10),
            text_color="#666666"
        )
        self.lbl_mac.pack(pady=(0, 10))

        self.lbl_status = ctk.CTkLabel(
            self.inner_frame,
            text="ONLINE",
            text_color=config.COLOR_ONLINE,
            font=("Roboto", 22, "bold")
        )
        self.lbl_status.pack()

    def update_name(self, new_name):
        self.lbl_name.configure(text=new_name)

    def set_offline(self):
        self.lbl_status.configure(
            text="OFFLINE",
            text_color=config.COLOR_OFFLINE
        )
        self.configure(
            border_color=config.COLOR_OFFLINE,
            border_width=2
        )

    def set_online(self):
        self.lbl_status.configure(
            text="ONLINE",
            text_color=config.COLOR_ONLINE
        )
        self.configure(border_width=0)