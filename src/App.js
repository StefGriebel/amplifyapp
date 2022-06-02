import React, { useState, useEffect} from 'react';
import './App.css';
import logo from './logo.svg';
import { API, Storage } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import {
  withAuthenticator,
  Button,
  Card,
  View,
  Flex,
  Heading,
  Text,
  TextField,
  Image,
  useTheme
} from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App({signOut}) {
  const { tokens } = useTheme();
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData }});
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({query: deleteNoteMutation, variables: { input: { id }}});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({...formData, image: file.name});
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <View 
      backgroundColor={tokens.colors.background.secondary}
      padding={tokens.space.medium}
      maxWidth="80%"
      margin="auto"
    
    >
      <Flex
        direction="row"
        alignItems="flex-start"
      >
        <Heading level={1}>My Notes App</Heading>
        <Button onClick={signOut} backgroundColor="red" color="white">Sign Out</Button>
      </Flex>
      <Card>
        <Flex
          direction="row" 
          alignItems="flex-start"
        >
          <TextField
            onChange={e => setFormData({...formData, 'name': e.target.value})} 
            placeholder='Note name'
            value={formData.name}
            type="text"
            inputMode="text"
          />
          <TextField 
            onChange={e => setFormData({...formData, 'description': e.target.value})}
            placeholder='Note description'
            value={formData.description}
            type="text"
            inputMode="text"
          />
          <TextField
            type='file'
            onChange={onChange}
            inputMode="text"
          />
          <Button onClick={createNote} variation='primary'>Create Note</Button>
        </Flex>
      </Card>
      <div style={{marginBottom: 30}}>
        {
          notes.map(note => (
            <Card key={note.id || note.name}>
              <Flex
                direction="row" 
                alignItems="flex-start"
              >
                  {
                    note.image ? <Image src={note.image} width={200} alt={note.id} /> : <Image src={logo} width={200} alt={note.id} />
                  }
                  <Flex
                    direction="column"
                    alignItems="flex-start"
                  >
                    <Heading level={3}>{note.name}</Heading>
                    <Text>{note.description}</Text>
                    <Button onClick={() => deleteNote(note)}>❌</Button>
                  </Flex>
                </Flex>
            </Card>
          ))
        }
      </div>
    </View>
  )
}

export default withAuthenticator(App);
