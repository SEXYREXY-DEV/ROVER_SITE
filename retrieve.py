with open("page.txt", "w", encoding="utf-8") as f:
    for line in f:
        if line.startswith("<title>"):
            title = line.split("<title>")[1].split("</title>")[0]
            print(title)
            break